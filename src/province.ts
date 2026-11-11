/**
 * Si los dos primeros dígitos son una provincia que emite cédulas y RUCs:
 * del 01 al 24, y el 30 de los ecuatorianos registrados en el exterior.
 */
export const isProvince = (code: string): boolean => {
  const province = Number(code.slice(0, 2));

  return (province >= 1 && province <= 24) || province === 30;
};
