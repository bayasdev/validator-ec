import * as gs from "@hegeldev/hegel/generators";

const DIGITS = "0123456789";

/** Las provincias que emiten cédulas: del 01 al 24, y el 30 de los ecuatorianos en el exterior. */
const PROVINCES = [
  ...Array.from({ length: 24 }, (_, index) =>
    String(index + 1).padStart(2, "0")
  ),
  "30",
];

/** Los códigos de dos dígitos que no son provincias. */
export const NON_PROVINCES = Array.from({ length: 100 }, (_, index) =>
  String(index).padStart(2, "0")
).filter((code) => !PROVINCES.includes(code));

/**
 * Oráculo escrito a partir de la regla del módulo 10 que publica el SRI:
 * coeficientes 2, 1, 2… sobre los nueve primeros dígitos, restando 9 a cada
 * producto mayor que 9; el verificador completa la suma hasta la siguiente
 * decena, o es 0 si ya es múltiplo de 10.
 */
export const checkDigit = (firstNine: string): number => {
  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    const product = Number(firstNine[index]) * (index % 2 === 0 ? 2 : 1);
    sum += product > 9 ? product - 9 : product;
  }

  return (10 - (sum % 10)) % 10;
};

export const digits = (size: number) =>
  gs.text({ alphabet: DIGITS, maxSize: size, minSize: size });

/** Nueve dígitos con una provincia y un tercer dígito tomados de los dados. */
const firstNine = (provinces: string[], thirdDigits: string) =>
  gs.composite((tc) => {
    const province = tc.draw(gs.sampledFrom(provinces));
    const third = tc.draw(gs.sampledFrom(thirdDigits.split("")));

    return `${province}${third}${tc.draw(digits(6))}`;
  });

const withCheckDigit = (nine: string) => `${nine}${checkDigit(nine)}`;

/** Una cédula válida según el oráculo. */
export const cedula = gs.composite((tc) =>
  withCheckDigit(tc.draw(firstNine(PROVINCES, "012345")))
);

/** Diez dígitos con el verificador del módulo 10 pero un tercer dígito del 6 al 9. */
export const checksumValidNonNatural = gs.composite((tc) =>
  withCheckDigit(tc.draw(firstNine(PROVINCES, "6789")))
);

/** Diez dígitos con el verificador del módulo 10 pero una provincia que no existe. */
export const checksumValidNonProvince = gs.composite((tc) =>
  withCheckDigit(tc.draw(firstNine(NON_PROVINCES, "012345")))
);

/** Los diez primeros dígitos del RUC de una sociedad o entidad pública, sin verificador que cumplir. */
export const nonNaturalBase = (
  thirdDigit: "6" | "9",
  provinces: string[] = PROVINCES
) =>
  gs.composite((tc) => {
    const province = tc.draw(gs.sampledFrom(provinces));

    return `${province}${thirdDigit}${tc.draw(digits(7))}`;
  });

/** Cualquier cadena de dígitos de una longitud distinta de la dada. */
export const digitsOtherThan = (size: number) =>
  gs.composite((tc) => {
    const length = tc.draw(
      gs.integers({ maxValue: 20, minValue: 0 }).filter((n) => n !== size)
    );

    return tc.draw(digits(length));
  });

/** Una cadena válida con un carácter cambiado por algo que no es un dígito ASCII. */
export const withNonDigit = (valid: string) =>
  gs.composite((tc) => {
    const at = tc.draw(
      gs.integers({ maxValue: valid.length - 1, minValue: 0 })
    );

    const other = tc.draw(gs.sampledFrom([" ", "-", "a", ".", "٣", "１"]));

    return `${valid.slice(0, at)}${other}${valid.slice(at + 1)}`;
  });
