const SIX_DIGITS = /^\d{6}$/u;

/**
 * Valida un código postal ecuatoriano: seis dígitos que empiezan por una
 * provincia del 01 al 24.
 *
 * @example isZipCode("170150") // true
 */
export const isZipCode = (zipCode: string): boolean => {
  if (!SIX_DIGITS.test(zipCode)) {
    return false;
  }

  const province = Number(zipCode.slice(0, 2));

  return province >= 1 && province <= 24;
};
