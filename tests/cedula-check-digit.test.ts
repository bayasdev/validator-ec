import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { describe, expect, it } from "vitest";
import { isCedula } from "../src";

const DIGITS = "0123456789";

/**
 * Oráculo escrito a partir de la regla del módulo 10 que publica el SRI:
 * coeficientes 2, 1, 2… sobre los nueve primeros dígitos, restando 9 a cada
 * producto mayor que 9, y el verificador completa la suma hasta la siguiente
 * decena (0 si ya es múltiplo de 10).
 */
const checkDigit = (firstNine: string) => {
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    const product = Number(firstNine[index]) * (index % 2 === 0 ? 2 : 1);
    sum += product > 9 ? product - 9 : product;
  }
  return (10 - (sum % 10)) % 10;
};

/** Provincias 01 a 24 y 30, la de los ecuatorianos registrados en el exterior. */
const PROVINCES = [
  ...Array.from({ length: 24 }, (_, index) => String(index + 1).padStart(2, "0")),
  "30",
];

const firstNine = gs.composite((tc) => {
  const province = tc.draw(gs.sampledFrom(PROVINCES));
  const rest = tc.draw(gs.text({ alphabet: DIGITS, minSize: 7, maxSize: 7 }));
  return `${province}${rest}`;
});

describe("dígito verificador de la cédula", () => {
  it("acepta toda cédula cuyo verificador sigue la regla del módulo 10", () => {
    hegel.test(
      (tc) => {
        const nine = tc.draw(firstNine);
        expect(isCedula(`${nine}${checkDigit(nine)}`)).toBe(true);
      },
      { testCases: 500 }
    );
  });

  it("rechaza toda cédula con cualquier otro verificador", () => {
    hegel.test(
      (tc) => {
        const nine = tc.draw(firstNine);
        const offset = tc.draw(gs.integers({ minValue: 1, maxValue: 9 }));
        const wrong = (checkDigit(nine) + offset) % 10;
        expect(isCedula(`${nine}${wrong}`)).toBe(false);
      },
      { testCases: 500 }
    );
  });

  // Regresión de validator-ec 1.3.0, que redondeaba a la decena desde el
  // primer dígito de la suma: con suma 1 llegaba a 20 y devolvía 0, no 9.
  it("acepta 0100000009, cuya suma de los nueve primeros dígitos es 1", () => {
    expect(isCedula("0100000009")).toBe(true);
    expect(isCedula("0100000000")).toBe(false);
  });
});
