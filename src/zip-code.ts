import { isProvince } from "./province.ts";

const SIX_DIGITS = /^\d{6}$/u;

/**
 * Valida un código postal ecuatoriano: seis dígitos que empiezan por una
 * provincia del 01 al 24.
 *
 * @example isZipCode("170150") // true
 */
export const isZipCode = (zipCode: string): boolean =>
  SIX_DIGITS.test(zipCode) && isProvince(zipCode);
