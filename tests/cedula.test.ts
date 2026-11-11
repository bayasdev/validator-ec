import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { describe, expect, it } from "vitest";
import { isCedula } from "../src/index.ts";
import {
  cedula,
  checkDigit,
  checksumValidNonNatural,
  checksumValidNonProvince,
  digitsOtherThan,
  withNonDigit,
} from "./oracle.ts";

describe(isCedula, () => {
  it("acepta toda cédula cuyo verificador sigue la regla del módulo 10", () => {
    hegel.test(
      (tc) => {
        expect(isCedula(tc.draw(cedula))).toBeTruthy();
      },
      { testCases: 500 }
    );
  });

  it("rechaza toda cédula con cualquier otro dígito verificador", () => {
    hegel.test(
      (tc) => {
        const nine = tc.draw(cedula).slice(0, 9);
        const offset = tc.draw(gs.integers({ maxValue: 9, minValue: 1 }));
        expect(
          isCedula(`${nine}${(checkDigit(nine) + offset) % 10}`)
        ).toBeFalsy();
      },
      { testCases: 500 }
    );
  });

  it("rechaza un tercer dígito del 6 al 9 aunque cumpla el módulo 10", () => {
    hegel.test((tc) => {
      expect(isCedula(tc.draw(checksumValidNonNatural))).toBeFalsy();
    });
  });

  it("rechaza una provincia que no existe aunque cumpla el módulo 10", () => {
    hegel.test((tc) => {
      expect(isCedula(tc.draw(checksumValidNonProvince))).toBeFalsy();
    });
  });

  it("rechaza todo lo que no sean exactamente diez dígitos", () => {
    hegel.test((tc) => {
      expect(isCedula(tc.draw(digitsOtherThan(10)))).toBeFalsy();
    });
  });

  it("rechaza una cédula válida con un carácter que no es un dígito", () => {
    hegel.test((tc) => {
      expect(isCedula(tc.draw(withNonDigit(tc.draw(cedula))))).toBeFalsy();
    });
  });

  // Regresión de validator-ec 1.3.0, que redondeaba a la decena desde el
  // primer dígito de la suma: con suma 1 llegaba a 20 y devolvía 0, no 9.
  it("acepta 0100000009, cuya suma de los nueve primeros dígitos es 1", () => {
    expect(isCedula("0100000009")).toBeTruthy();
    expect(isCedula("0100000000")).toBeFalsy();
  });
});
