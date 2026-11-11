import { readFileSync } from "node:fs";
import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { describe, expect, it } from "vitest";
import { isZipCode } from "../src/index.ts";
import { digits, offByOneDigit, withNonDigit } from "./oracle.ts";

/**
 * Los códigos postales de Ecuador que lista GeoNames (EC.zip, descargado el
 * 11 de noviembre de 2026, CC BY 4.0, https://www.geonames.org/). No es una
 * lista completa ni oficial, pero sí independiente de este código.
 */
const GEONAMES_CODES = readFileSync(
  new URL("data/geonames-ec-postal-codes.txt", import.meta.url),
  "utf-8"
)
  .split("\n")
  .filter((line) => line.length > 0);

/** Los prefijos que puede tener un código postal: del 01 al 24, y el 90 de las zonas no delimitadas. */
const PREFIXES = [
  ...Array.from({ length: 24 }, (_, index) =>
    String(index + 1).padStart(2, "0")
  ),
  "90",
];

const zipCode = gs.composite(
  (tc) => `${tc.draw(gs.sampledFrom(PREFIXES))}${tc.draw(digits(4))}`
);

describe(isZipCode, () => {
  it("acepta todo código postal que lista GeoNames", () => {
    expect(GEONAMES_CODES.filter((code) => !isZipCode(code))).toStrictEqual([]);
  });

  it("acepta seis dígitos que empiezan por una provincia del 01 al 24 o por 90", () => {
    hegel.test((tc) => {
      expect(isZipCode(tc.draw(zipCode))).toBeTruthy();
    });
  });

  it("rechaza seis dígitos que empiezan por cualquier otro código", () => {
    hegel.test((tc) => {
      const value = tc.draw(digits(6));
      tc.assume(!PREFIXES.includes(value.slice(0, 2)));
      expect(isZipCode(value)).toBeFalsy();
    });
  });

  it("rechaza un código válido con un dígito de más o de menos", () => {
    hegel.test((tc) => {
      expect(isZipCode(tc.draw(offByOneDigit(tc.draw(zipCode))))).toBeFalsy();
    });
  });

  it("rechaza un código válido con un carácter que no es un dígito", () => {
    hegel.test((tc) => {
      expect(isZipCode(tc.draw(withNonDigit(tc.draw(zipCode))))).toBeFalsy();
    });
  });
});
