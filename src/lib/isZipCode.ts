import isDigits from "../helpers/isDigits";

/**
 * Valida un código postal ecuatoriano.
 *
 * @param {string} zipCode El código postal a validar.
 * @returns {boolean} Devuelve `true` si el código postal es válido, de lo contrario devuelve `false`.
 */
export default function isZipCode(zipCode: string): boolean {
  // Verificamos que el código postal tenga 6 dígitos
  if (zipCode.length !== 6) {
    return false;
  }

  // Verificamos que todos los caracteres sean dígitos
  if (!isDigits(zipCode)) {
    return false;
  }

  // Extraemos el código de provincia
  const provinceCode = parseInt(zipCode[0] + zipCode[1], 10);

  // Verificamos que el código de provincia sea válido
  if (provinceCode < 1 || provinceCode > 24) {
    return false;
  }

  return true;
}
