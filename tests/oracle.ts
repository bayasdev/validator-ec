import * as gs from "@hegeldev/hegel/generators";

const DIGITS = "0123456789";

const twoDigits = (n: number) => String(n).padStart(2, "0");

/** Las 24 provincias, del 01 al 24. */
const PROVINCES = Array.from({ length: 24 }, (_, index) =>
  twoDigits(index + 1)
);

/** Lo que puede empezar una cédula: una provincia, o el 30 de los ecuatorianos en el exterior. */
const CEDULA_PROVINCES = [...PROVINCES, "30"];

const ALL_CODES = Array.from({ length: 100 }, (_, index) => twoDigits(index));

/** Los códigos de dos dígitos que no pueden empezar una cédula. */
const NON_CEDULA_PROVINCES = ALL_CODES.filter(
  (code) => !CEDULA_PROVINCES.includes(code)
);

/** Los códigos que no son una provincia, el 30 incluido. */
export const NON_PROVINCES = ALL_CODES.filter(
  (code) => !PROVINCES.includes(code)
);

const digitSum = (n: number) =>
  String(n)
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);

/**
 * Si diez dígitos cumplen el módulo 10 del SRI, escrito de otra forma que el
 * código: con los coeficientes 2, 1, 2, 1… sobre los diez dígitos (el
 * verificador con 1), la suma de las cifras de cada producto es múltiplo
 * de 10.
 */
const passesModulo10 = (ten: string) =>
  ten
    .split("")
    .reduce(
      (sum, digit, index) =>
        sum + digitSum(Number(digit) * (index % 2 === 0 ? 2 : 1)),
      0
    ) %
    10 ===
  0;

/** El único dígito que, puesto al final, hace que nueve dígitos cumplan el módulo 10. */
export const checkDigit = (firstNine: string): number => {
  const found = DIGITS.split("").find((digit) =>
    passesModulo10(`${firstNine}${digit}`)
  );

  if (found === undefined) {
    throw new Error(`No check digit for ${firstNine}`);
  }

  return Number(found);
};

export const digits = (size: number) =>
  gs.text({ alphabet: DIGITS, maxSize: size, minSize: size });

/** Nueve dígitos con un prefijo y un tercer dígito tomados de los dados. */
const firstNine = (prefixes: string[], thirdDigits: string) =>
  gs.composite((tc) => {
    const prefix = tc.draw(gs.sampledFrom(prefixes));
    const third = tc.draw(gs.sampledFrom(thirdDigits.split("")));

    return `${prefix}${third}${tc.draw(digits(6))}`;
  });

const withCheckDigit = (nine: string) => `${nine}${checkDigit(nine)}`;

/** Una cédula válida según el oráculo. */
export const cedula = gs.composite((tc) =>
  withCheckDigit(tc.draw(firstNine(CEDULA_PROVINCES, "012345")))
);

/** Diez dígitos que cumplen el módulo 10 con los terceros dígitos dados. */
export const checksumValidWithThird = (thirdDigits: string) =>
  gs.composite((tc) =>
    withCheckDigit(tc.draw(firstNine(CEDULA_PROVINCES, thirdDigits)))
  );

/** Diez dígitos que cumplen el módulo 10 pero no empiezan por una provincia de cédula. */
export const checksumValidNonProvince = gs.composite((tc) =>
  withCheckDigit(tc.draw(firstNine(NON_CEDULA_PROVINCES, "012345")))
);

/** Los diez primeros dígitos del RUC de una sociedad o entidad pública, sin verificador que cumplir. */
export const nonNaturalBase = (
  thirdDigit: "6" | "9",
  prefixes: string[] = PROVINCES
) =>
  gs.composite((tc) => {
    const prefix = tc.draw(gs.sampledFrom(prefixes));

    return `${prefix}${thirdDigit}${tc.draw(digits(7))}`;
  });

/** Una cadena válida con un dígito de más o de menos, en cualquier posición. */
export const offByOneDigit = (valid: string) =>
  gs.composite((tc) => {
    const at = tc.draw(gs.integers({ maxValue: valid.length, minValue: 0 }));

    if (tc.draw(gs.booleans())) {
      return `${valid.slice(0, at)}${tc.draw(digits(1))}${valid.slice(at)}`;
    }

    const removed = Math.min(at, valid.length - 1);

    return `${valid.slice(0, removed)}${valid.slice(removed + 1)}`;
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
