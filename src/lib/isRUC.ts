import isDigits from "../helpers/isDigits";
import isCedula from "./isCedula";

/**
 * Valida un RUC ecuatoriano.
 *
 * @param {string} ruc El RUC a validar.
 * @returns {boolean} Devuelve `true` si el RUC es válido, de lo contrario devuelve `false`.
 */
export default function isRUC(ruc: string): boolean {
  // Verificamos que el RUC tenga 13 dígitos
  if (ruc.length !== 13) {
    return false;
  }

  // Verificamos que todos los caracteres sean dígitos
  if (!isDigits(ruc)) {
    return false;
  }

  // Extraemos los primeros 10 dígitos (cédula o código base)
  const baseCode = ruc.substring(0, 10);

  // Extraemos los últimos 3 dígitos (código de establecimiento)
  const establishmentCode = ruc.substring(10, 13);

  // Verificamos que el código de establecimiento sea 001
  if (establishmentCode !== "001") {
    return false;
  }

  // Obtenemos el tercer dígito para determinar el tipo de entidad
  // Fuente: https://www.sri.gob.ec/ruc-personas-naturales
  const thirdDigit = parseInt(ruc[2], 10);

  // Validación para personas naturales (tercer dígito entre 0 y 5)
  if (thirdDigit >= 0 && thirdDigit <= 5) {
    // Validamos que los primeros 10 dígitos sean una cédula válida
    return isCedula(baseCode);
  }

  // Validación para personas jurídicas (tercer dígito es 9)
  if (thirdDigit === 9) {
    return validateLegalEntityRUC(ruc);
  }

  // Validación para entidades públicas (tercer dígito es 6)
  if (thirdDigit === 6) {
    return validatePublicEntityRUC(ruc);
  }

  // Si el tercer dígito no es válido, el RUC es inválido
  return false;
}

// Función para validar RUC de personas jurídicas
function validateLegalEntityRUC(ruc: string): boolean {
  // Coeficientes para personas jurídicas
  const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  const baseCode = ruc.substring(0, 9);
  const validatorDigit = parseInt(ruc[9], 10);

  let sum = 0;
  for (let i = 0; i < coefficients.length; i++) {
    const value = parseInt(baseCode[i], 10) * coefficients[i];
    sum += value;
  }

  const remainder = sum % 11;
  const result = remainder === 0 ? 0 : 11 - remainder;

  return result === validatorDigit;
}

// Función para validar RUC de entidades públicas
function validatePublicEntityRUC(ruc: string): boolean {
  // Coeficientes para entidades públicas
  const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
  const baseCode = ruc.substring(0, 8);
  const validatorDigit = parseInt(ruc[8], 10);

  let sum = 0;
  for (let i = 0; i < coefficients.length; i++) {
    const value = parseInt(baseCode[i], 10) * coefficients[i];
    sum += value;
  }

  const remainder = sum % 11;
  const result = remainder === 0 ? 0 : 11 - remainder;

  return result === validatorDigit;
}
