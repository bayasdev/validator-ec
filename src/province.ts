const provinceOf = (code: string) => Number(code.slice(0, 2));

/** Si los dos primeros dígitos son una de las 24 provincias, del 01 al 24. */
export const isProvince = (code: string): boolean => {
  const province = provinceOf(code);

  return province >= 1 && province <= 24;
};

/**
 * Si los dos primeros dígitos pueden empezar una cédula: una provincia, o el
 * 30 de los ecuatorianos registrados en el exterior. Una sociedad o una
 * entidad pública lleva la provincia de su establecimiento principal, así
 * que el 30 no empieza su RUC.
 */
export const isCedulaProvince = (code: string): boolean =>
  isProvince(code) || provinceOf(code) === 30;
