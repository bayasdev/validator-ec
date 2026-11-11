/**
 * La identificación del consumidor final en los comprobantes electrónicos
 * (tipo 07 de la tabla 6 de la ficha técnica del SRI, versión 2.22).
 */
export const CONSUMIDOR_FINAL = "9999999999999";

/** Si una identificación es la del consumidor final. No es un RUC ni una cédula. */
export const isConsumidorFinal = (identification: string): boolean =>
  identification === CONSUMIDOR_FINAL;
