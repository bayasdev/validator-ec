import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { describe, expect, it } from "vitest";
import {
  CONSUMIDOR_FINAL,
  cedulaOfRUC,
  isConsumidorFinal,
  isLegalEntityRUC,
  isNaturalPerson,
  isPublicEntityRUC,
  isRUC,
  sameTaxpayer,
  taxpayerTypeOf,
} from "../src/index.ts";
import {
  cedula,
  checkDigit,
  checksumValidNonNatural,
  digits,
  digitsOtherThan,
  NON_PROVINCES,
  nonNaturalBase,
  withNonDigit,
} from "./oracle.ts";

const nonNaturalRUC = gs.composite(
  (tc) =>
    `${tc.draw(nonNaturalBase(tc.draw(gs.sampledFrom(["6", "9"] as const))))}001`
);

/** Un RUC válido de cualquier tipo. */
const anyRUC = gs.composite((tc) => {
  const kind = tc.draw(gs.sampledFrom(["natural", "sociedad"] as const));

  return kind === "natural" ? `${tc.draw(cedula)}001` : tc.draw(nonNaturalRUC);
});

/** Cualquier terminación de tres dígitos que no sea 001. */
const otherSuffix = digits(3).filter((suffix) => suffix !== "001");

describe("isRUC de una persona natural", () => {
  it("acepta toda cédula válida seguida de 001", () => {
    hegel.test(
      (tc) => {
        expect(isRUC(`${tc.draw(cedula)}001`)).toBeTruthy();
      },
      { testCases: 500 }
    );
  });

  it("rechaza diez dígitos que no son una cédula válida, seguidos de 001", () => {
    hegel.test((tc) => {
      const nine = tc.draw(cedula).slice(0, 9);
      const offset = tc.draw(gs.integers({ maxValue: 9, minValue: 1 }));
      const wrong = `${nine}${(checkDigit(nine) + offset) % 10}`;
      expect(isRUC(`${wrong}001`)).toBeFalsy();
    });
  });
});

describe("isRUC de una sociedad o una entidad pública", () => {
  it("acepta un tercer dígito 6 o 9 con una provincia válida, sin exigir un verificador", () => {
    hegel.test(
      (tc) => {
        expect(isRUC(tc.draw(nonNaturalRUC))).toBeTruthy();
      },
      { testCases: 500 }
    );
  });

  it("rechaza un tercer dígito 6 o 9 con una provincia que no existe", () => {
    hegel.test((tc) => {
      const third = tc.draw(gs.sampledFrom(["6", "9"] as const));
      expect(
        isRUC(`${tc.draw(nonNaturalBase(third, NON_PROVINCES))}001`)
      ).toBeFalsy();
    });
  });

  it("rechaza un tercer dígito 7 u 8, que el SRI no asigna", () => {
    hegel.test((tc) => {
      const valid = tc.draw(checksumValidNonNatural);
      tc.assume(valid[2] === "7" || valid[2] === "8");
      expect(isRUC(`${valid}001`)).toBeFalsy();
    });
  });

  // RUCs reales que no cumplen el módulo 11 y que el SRI declara válidos:
  // los dos primeros, del comunicado del SRI citado en
  // https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32; el tercero,
  // de una S.A.S. a la que el SRI autorizó facturas
  // (https://github.com/ma74ni/facturador-sri/pull/51).
  it("acepta RUCs reales emitidos por el SRI que no cumplen el módulo 11", () => {
    expect(isRUC("1793189906001")).toBeTruthy();
    expect(isRUC("0993366721001")).toBeTruthy();
    expect(isRUC("1793207110001")).toBeTruthy();
  });
});

describe("isRUC en general", () => {
  it("rechaza toda terminación distinta de 001", () => {
    hegel.test((tc) => {
      const base = tc.draw(anyRUC).slice(0, 10);
      expect(isRUC(`${base}${tc.draw(otherSuffix)}`)).toBeFalsy();
    });
  });

  it("rechaza todo lo que no sean exactamente trece dígitos", () => {
    hegel.test((tc) => {
      expect(isRUC(tc.draw(digitsOtherThan(13)))).toBeFalsy();
    });
  });

  it("rechaza un RUC válido con un carácter que no es un dígito", () => {
    hegel.test((tc) => {
      expect(isRUC(tc.draw(withNonDigit(tc.draw(anyRUC))))).toBeFalsy();
    });
  });

  it("no toma al consumidor final por un RUC", () => {
    expect(isConsumidorFinal(CONSUMIDOR_FINAL)).toBeTruthy();
    expect(isRUC(CONSUMIDOR_FINAL)).toBeFalsy();
    expect(taxpayerTypeOf(CONSUMIDOR_FINAL)).toBeNull();
  });
});

describe("a quién pertenece un RUC", () => {
  it("una persona natural tiene su cédula dentro de su RUC", () => {
    hegel.test((tc) => {
      const id = tc.draw(cedula);
      const ruc = `${id}001`;
      expect(taxpayerTypeOf(ruc)).toBe("persona_natural");
      expect(cedulaOfRUC(ruc)).toBe(id);
      expect(isNaturalPerson(ruc)).toBeTruthy();
      expect(isNaturalPerson(id)).toBeTruthy();
      expect(isLegalEntityRUC(ruc) || isPublicEntityRUC(ruc)).toBeFalsy();
    });
  });

  it("una sociedad o entidad pública no es una persona natural ni tiene cédula", () => {
    hegel.test((tc) => {
      const ruc = tc.draw(nonNaturalRUC);
      expect(taxpayerTypeOf(ruc)).toBe("sociedad");
      expect(cedulaOfRUC(ruc)).toBeNull();
      expect(isNaturalPerson(ruc)).toBeFalsy();
      expect(isLegalEntityRUC(ruc)).toBe(ruc[2] === "9");
      expect(isPublicEntityRUC(ruc)).toBe(ruc[2] === "6");
    });
  });

  it("nada que no sea un RUC válido tiene tipo ni cédula", () => {
    hegel.test((tc) => {
      const value = tc.draw(digitsOtherThan(13));
      expect(taxpayerTypeOf(value)).toBeNull();
      expect(cedulaOfRUC(value)).toBeNull();
      expect(isLegalEntityRUC(value) || isPublicEntityRUC(value)).toBeFalsy();
    });
  });
});

describe(sameTaxpayer, () => {
  it("une el RUC de una persona natural con su cédula, en ambos sentidos", () => {
    hegel.test((tc) => {
      const id = tc.draw(cedula);
      expect(sameTaxpayer(`${id}001`, id)).toBeTruthy();
      expect(sameTaxpayer(id, `${id}001`)).toBeTruthy();
    });
  });

  it("no une a dos personas distintas", () => {
    hegel.test((tc) => {
      const a = tc.draw(cedula);
      const b = tc.draw(cedula);
      tc.assume(a !== b);
      expect(sameTaxpayer(`${a}001`, b)).toBeFalsy();
      expect(sameTaxpayer(a, b)).toBeFalsy();
    });
  });

  it("no une el RUC de una sociedad con sus diez primeros dígitos", () => {
    hegel.test((tc) => {
      const ruc = tc.draw(nonNaturalRUC);
      expect(sameTaxpayer(ruc, ruc.slice(0, 10))).toBeFalsy();
    });
  });
});
