export default function isCedula(cedula: string): boolean {
  // Validamos que la cédula solo contenga 10 dígitos
  if (cedula.length === 10) {
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

    // Extraemos el primer digito de la suma
    const firstDigit = parseInt(sum.toString()[0], 10);

    // Obtenemos la decena
    const dozen = (firstDigit + 1) * 10;

    // Obtenemos el dígito validador
    let validatorDigit = dozen - sum;

    // Si el dígito verificador es mayor a 10 lo igualamos a 0
    if (validatorDigit >= 10) {
      validatorDigit = 0;
    }

    // Codigo de provincia
    // Validamos si la cedula pertenece a alguna provincia
    const provinceCode = parseInt(cedula[0] + cedula[1]);

    // Valida cédulas locales y de Ecuatorianos en el exterior
    if (provinceCode > 24 && provinceCode != 30) {
      return false;
    }

    if (validatorDigit == lastDigit) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
