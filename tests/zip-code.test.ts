import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { describe, expect, it } from "vitest";
import { isZipCode } from "../src/index.ts";
import { digits, digitsOtherThan, withNonDigit } from "./oracle.ts";

/** Las provincias que tienen códigos postales: del 01 al 24. */
const ZIP_PROVINCES = Array.from({ length: 24 }, (_, index) =>
  String(index + 1).padStart(2, "0")
);

const zipCode = gs.composite(
  (tc) => `${tc.draw(gs.sampledFrom(ZIP_PROVINCES))}${tc.draw(digits(4))}`
);

describe(isZipCode, () => {
  it("acepta seis dígitos que empiezan por una provincia del 01 al 24", () => {
    hegel.test((tc) => {
      expect(isZipCode(tc.draw(zipCode))).toBeTruthy();
    });
  });

  it("rechaza seis dígitos que empiezan por cualquier otro código", () => {
    hegel.test((tc) => {
      const value = tc.draw(digits(6));
      tc.assume(!ZIP_PROVINCES.includes(value.slice(0, 2)));
      expect(isZipCode(value)).toBeFalsy();
    });
  });

  it("rechaza todo lo que no sean exactamente seis dígitos", () => {
    hegel.test((tc) => {
      expect(isZipCode(tc.draw(digitsOtherThan(6)))).toBeFalsy();
    });
    hegel.test((tc) => {
      expect(isZipCode(tc.draw(withNonDigit(tc.draw(zipCode))))).toBeFalsy();
    });
  });
});
