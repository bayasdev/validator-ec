import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { describe, expect, it } from "vitest";
import { FINAL_CONSUMER, parseIdentification } from "../src/index.ts";
import {
  cedula,
  checkDigit,
  checksumValidNonProvince,
  checksumValidWithThird,
  digits,
  NON_PROVINCES,
  nonNaturalBase,
  offByOneDigit,
  withNonDigit,
} from "./oracle.ts";

const reasonOf = (value: string) => {
  const read = parseIdentification(value);

  return read.ok ? null : read.reason;
};

const otherSuffix = digits(3).filter((suffix) => suffix !== "001");

describe("lo que parseIdentification lee", () => {
  it("una cédula válida es la de una persona natural", () => {
    hegel.test((tc) => {
      expect(parseIdentification(tc.draw(cedula))).toStrictEqual({
        kind: "cedula",
        ok: true,
        taxpayer: "persona_natural",
      });
    });
  });

  it("el RUC de una persona natural, de una entidad pública y de una sociedad o extranjero", () => {
    hegel.test((tc) => {
      expect(parseIdentification(`${tc.draw(cedula)}001`)).toStrictEqual({
        kind: "ruc",
        ok: true,
        taxpayer: "persona_natural",
      });
      expect(
        parseIdentification(`${tc.draw(nonNaturalBase("6"))}001`)
      ).toStrictEqual({ kind: "ruc", ok: true, taxpayer: "sociedad" });
      expect(
        parseIdentification(`${tc.draw(nonNaturalBase("9"))}001`)
      ).toStrictEqual({
        kind: "ruc",
        ok: true,
        taxpayer: "sociedad_o_extranjero",
      });
    });
  });

  // Tipo 07 de la tabla 6 de la ficha técnica del SRI, versión 2.22.
  it("trece nueves son el consumidor final, no un RUC", () => {
    expect(parseIdentification(FINAL_CONSUMER)).toStrictEqual({
      kind: "consumidor_final",
      ok: true,
    });
  });
});

describe("por qué parseIdentification rechaza un valor", () => {
  it("longitud, si una cédula o un RUC válidos tienen un dígito de más o de menos", () => {
    hegel.test((tc) => {
      const valid = tc.draw(
        tc.draw(gs.booleans())
          ? cedula
          : gs.composite((t) => `${t.draw(cedula)}001`)
      );

      expect(reasonOf(tc.draw(offByOneDigit(valid)))).toBe("longitud");
    });
  });

  it("caracteres, si una cédula o un RUC válidos tienen algo que no es un dígito", () => {
    hegel.test((tc) => {
      const valid = tc.draw(
        tc.draw(gs.booleans())
          ? cedula
          : gs.composite((t) => `${t.draw(cedula)}001`)
      );

      expect(reasonOf(tc.draw(withNonDigit(valid)))).toBe("caracteres");
    });
  });

  it("provincia, si una cédula o el RUC de una sociedad no empiezan por una provincia que los emita", () => {
    hegel.test((tc) => {
      expect(reasonOf(tc.draw(checksumValidNonProvince))).toBe("provincia");

      const third = tc.draw(gs.sampledFrom(["6", "9"] as const));

      expect(
        reasonOf(`${tc.draw(nonNaturalBase(third, NON_PROVINCES))}001`)
      ).toBe("provincia");
    });
  });

  it("tercer_digito, si una cédula tiene del 6 al 9 o un RUC tiene 7 u 8", () => {
    hegel.test((tc) => {
      expect(reasonOf(tc.draw(checksumValidWithThird("6789")))).toBe(
        "tercer_digito"
      );
      expect(reasonOf(`${tc.draw(checksumValidWithThird("78"))}001`)).toBe(
        "tercer_digito"
      );
    });
  });

  it("digito_verificador, si una cédula o su RUC tienen otro verificador", () => {
    hegel.test((tc) => {
      const nine = tc.draw(cedula).slice(0, 9);
      const offset = tc.draw(gs.integers({ maxValue: 9, minValue: 1 }));
      const wrong = `${nine}${(checkDigit(nine) + offset) % 10}`;

      expect(reasonOf(wrong)).toBe("digito_verificador");
      expect(reasonOf(`${wrong}001`)).toBe("digito_verificador");
    });
  });

  it("establecimiento, si un RUC válido no termina en 001", () => {
    hegel.test((tc) => {
      const base = tc.draw(
        tc.draw(gs.booleans()) ? cedula : nonNaturalBase("9")
      );

      expect(reasonOf(`${base}${tc.draw(otherSuffix)}`)).toBe(
        "establecimiento"
      );
    });
  });
});
