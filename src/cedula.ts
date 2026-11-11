import { isCedulaProvince } from "./province.ts";

const TEN_DIGITS = /^\d{10}$/u;

/**
 * Valida una cédula de identidad ecuatoriana: diez dígitos, una provincia
 * válida, un tercer dígito del 0 al 5 (el 6 y el 9 los reserva el SRI para
 * RUCs de entidades públicas y sociedades) y el dígito verificador del
 * módulo 10. Los coeficientes 2, 1, 2… se aplican a los nueve primeros
 * dígitos, a cada producto mayor que 9 se le resta 9, y el verificador
 * completa la suma hasta la siguiente decena.
 *
 * @example isCedula("1710034065") // true
 */
export const isCedula = (cedula: string): boolean => {
  if (!(TEN_DIGITS.test(cedula) && isCedulaProvince(cedula))) {
    return false;
  }

  if (Number(cedula[2]) > 5) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    const product = Number(cedula[index]) * (index % 2 === 0 ? 2 : 1);
    sum += product > 9 ? product - 9 : product;
  }

  return Number(cedula[9]) === (10 - (sum % 10)) % 10;
};
