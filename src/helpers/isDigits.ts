/**
 * @param {string} value La cadena de texto a validar.
 * @returns {boolean} Devuelve `true si la cadena de texto contiene únicamente dígitos, de lo contrario devuelve `false`.
 */
export default function isDigits(value: string): boolean {
  return /^\d+$/.test(value);
}
