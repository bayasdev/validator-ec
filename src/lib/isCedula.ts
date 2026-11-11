import isDigits from "../helpers/isDigits";

/**
 *
 * @param {string} cedula La cédula a validar.
 * @returns {boolean} Devuelve `true` si la cédula es válida, de lo contrario devuelve `false`.
 */
export default function isCedula(cedula: string): boolean {
  // Validamos que la cédula tenga 10 dígitos
  if (cedula.length !== 10) {
    return false;
  }

  // Verificamos que todos los caracteres sean dígitos
  if (!isDigits(cedula)) {
    return false;
  }

  // Definimos el último dígito o tambien llamado dígito verificador
  const lastDigit = parseInt(cedula[cedula.length - 1], 10);

  // Definimos las variables a utilizar
  let evens = 0;
  let odds = 0;
  let sum = 0;

  // Iteramos cada item excluyendo el último digito, aplicando el Algoritmo de Luhn
  for (let i = 1; i <= cedula.length - 1; i++) {
    if (i % 2 === 0) {
      evens += parseInt(cedula[i - 1]);
    } else {
      let x = parseInt(cedula[i - 1]) * 2;
      x > 9 ? (odds += x - 9) : (odds += x);
    }
  }

  sum += evens + odds;

  // El dígito verificador completa la suma hasta la siguiente decena, y es 0
  // si la suma ya es múltiplo de 10. Funciona también con sumas de un dígito.
  const validatorDigit = (10 - (sum % 10)) % 10;

  // Codigo de provincia
  // Validamos si la cedula pertenece a alguna provincia
  const provinceCode = parseInt(cedula[0] + cedula[1]);

  // Valida cédulas locales y de Ecuatorianos en el exterior
  if (provinceCode > 24 && provinceCode != 30) {
    return false;
  }

  // Si el dígito verificador es igual al último dígito de la cédula, la cédula es válida
  return validatorDigit === lastDigit;
}
