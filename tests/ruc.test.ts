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
  checksumValidWithThird,
  digits,
  NON_PROVINCES,
  nonNaturalBase,
  offByOneDigit,
  withNonDigit,
} from "./oracle.ts";

const companyRUC = gs.composite((tc) => `${tc.draw(nonNaturalBase("9"))}001`);
const publicRUC = gs.composite((tc) => `${tc.draw(nonNaturalBase("6"))}001`);
const naturalRUC = gs.composite((tc) => `${tc.draw(cedula)}001`);

/** Un RUC válido de cualquier tipo. */
const anyRUC = gs.composite((tc) => {
  const kind = tc.draw(
    gs.sampledFrom(["natural", "public", "company"] as const)
  );

  if (kind === "natural") {
    return tc.draw(naturalRUC);
  }

  return tc.draw(kind === "public" ? publicRUC : companyRUC);
});

/** Cualquier terminación de tres dígitos que no sea 001. */
const otherSuffix = digits(3).filter((suffix) => suffix !== "001");

/**
 * Algo que se parece a un RUC válido sin serlo: un RUC válido con otra
 * terminación, un dígito de más o de menos, un carácter que no es un dígito,
 * o un tercer dígito 6 o 9 tras algo que no es una provincia.
 */
const nearRUC = gs.composite((tc) => {
  const valid = tc.draw(anyRUC);

  const kind = tc.draw(
    gs.sampledFrom(["suffix", "length", "character", "province"] as const)
  );

  if (kind === "suffix") {
    return `${valid.slice(0, 10)}${tc.draw(otherSuffix)}`;
  }

  if (kind === "length") {
    return tc.draw(offByOneDigit(valid));
  }

  if (kind === "character") {
    return tc.draw(withNonDigit(valid));
  }

  const third = tc.draw(gs.sampledFrom(["6", "9"] as const));

  return `${tc.draw(nonNaturalBase(third, NON_PROVINCES))}001`;
});

describe("isRUC de una persona natural", () => {
  it("acepta toda cédula válida seguida de 001", () => {
    hegel.test(
      (tc) => {
        expect(isRUC(tc.draw(naturalRUC))).toBeTruthy();
      },
      { testCases: 500 }
    );
  });

  it("rechaza diez dígitos que no son una cédula válida, seguidos de 001", () => {
    hegel.test((tc) => {
      const nine = tc.draw(cedula).slice(0, 9);
      const offset = tc.draw(gs.integers({ maxValue: 9, minValue: 1 }));

      expect(
        isRUC(`${nine}${(checkDigit(nine) + offset) % 10}001`)
      ).toBeFalsy();
    });
  });
});

describe("isRUC de una sociedad o una entidad pública", () => {
  it("acepta un tercer dígito 6 o 9 tras una provincia, sin exigir un verificador", () => {
    hegel.test(
      (tc) => {
        expect(isRUC(tc.draw(publicRUC))).toBeTruthy();
        expect(isRUC(tc.draw(companyRUC))).toBeTruthy();
      },
      { testCases: 500 }
    );
  });

  it("rechaza un tercer dígito 6 o 9 tras algo que no es una provincia, el 30 incluido", () => {
    hegel.test((tc) => {
      const third = tc.draw(gs.sampledFrom(["6", "9"] as const));

      expect(
        isRUC(`${tc.draw(nonNaturalBase(third, NON_PROVINCES))}001`)
      ).toBeFalsy();
    });
  });

  it("rechaza un tercer dígito 7 u 8, que el SRI no asigna", () => {
    hegel.test((tc) => {
      expect(isRUC(`${tc.draw(checksumValidWithThird("78"))}001`)).toBeFalsy();
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

  // El ejemplo del propio comunicado del SRI, con su verificador del
  // módulo 11 (suma 140, residuo 8, verificador 3).
  // https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32
  it("acepta el RUC de ejemplo del comunicado del SRI, 1790085783001", () => {
    expect(isRUC("1790085783001")).toBeTruthy();
    expect(isLegalEntityRUC("1790085783001")).toBeTruthy();
  });
});

describe("isRUC en general", () => {
  it("rechaza todo lo que se parece a un RUC válido sin serlo", () => {
    hegel.test(
      (tc) => {
        const value = tc.draw(nearRUC);

        expect(isRUC(value)).toBeFalsy();
        expect(taxpayerTypeOf(value)).toBeNull();
        expect(cedulaOfRUC(value)).toBeNull();
      },
      { testCases: 500 }
    );
  });

  it("no da tipo ni une consigo mismo nada que se parezca a un RUC válido sin serlo", () => {
    hegel.test(
      (tc) => {
        const value = tc.draw(nearRUC);

        expect(isLegalEntityRUC(value)).toBeFalsy();
        expect(isPublicEntityRUC(value)).toBeFalsy();
        expect(sameTaxpayer(value, value)).toBeFalsy();
      },
      { testCases: 500 }
    );
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
      expect(isLegalEntityRUC(ruc)).toBeFalsy();
      expect(isPublicEntityRUC(ruc)).toBeFalsy();
    });
  });

  it("una cédula válida y su RUC son de una persona natural", () => {
    hegel.test((tc) => {
      const id = tc.draw(cedula);

      expect(isNaturalPerson(id)).toBeTruthy();
      expect(isNaturalPerson(`${id}001`)).toBeTruthy();
    });
  });

  it("una entidad pública es una sociedad, sin cédula", () => {
    hegel.test((tc) => {
      const ruc = tc.draw(publicRUC);

      expect(taxpayerTypeOf(ruc)).toBe("sociedad");
      expect(isPublicEntityRUC(ruc)).toBeTruthy();
      expect(isLegalEntityRUC(ruc)).toBeFalsy();
      expect(isNaturalPerson(ruc)).toBeFalsy();
      expect(cedulaOfRUC(ruc)).toBeNull();
    });
  });

  it("un tercer dígito 9 es una sociedad o un extranjero sin cédula, nunca con certeza una persona natural", () => {
    hegel.test((tc) => {
      const ruc = tc.draw(companyRUC);

      expect(taxpayerTypeOf(ruc)).toBe("sociedad_o_extranjero");
      expect(isLegalEntityRUC(ruc)).toBeTruthy();
      expect(isPublicEntityRUC(ruc)).toBeFalsy();
      expect(isNaturalPerson(ruc)).toBeFalsy();
      expect(cedulaOfRUC(ruc)).toBeNull();
    });
  });

  it("una cédula seguida de otra terminación no es una persona natural", () => {
    hegel.test((tc) => {
      expect(
        isNaturalPerson(`${tc.draw(cedula)}${tc.draw(otherSuffix)}`)
      ).toBeFalsy();
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

  it("une toda identificación válida consigo misma", () => {
    hegel.test((tc) => {
      const ruc = tc.draw(anyRUC);
      const id = tc.draw(cedula);

      expect(sameTaxpayer(ruc, ruc)).toBeTruthy();
      expect(sameTaxpayer(id, id)).toBeTruthy();
    });
  });

  it("no une el RUC de una persona con la cédula de otra", () => {
    hegel.test((tc) => {
      const a = tc.draw(cedula);
      const b = tc.draw(cedula.filter((other) => other !== a));

      expect(sameTaxpayer(`${a}001`, b)).toBeFalsy();
      expect(sameTaxpayer(b, `${a}001`)).toBeFalsy();
    });
  });

  it("no une el RUC de una sociedad con sus diez primeros dígitos", () => {
    hegel.test((tc) => {
      const ruc = tc.draw(tc.draw(gs.booleans()) ? publicRUC : companyRUC);

      expect(sameTaxpayer(ruc, ruc.slice(0, 10))).toBeFalsy();
    });
  });
});
