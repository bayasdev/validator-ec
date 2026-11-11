import { isCedula } from "./cedula.ts";
import { isProvince } from "./province.ts";

const THIRTEEN_DIGITS = /^\d{13}$/u;

/** A quién pertenece un RUC, como lo distinguen las declaraciones del SRI. */
export type TaxpayerType = "persona_natural" | "sociedad";

/**
 * Valida un RUC ecuatoriano: trece dígitos que terminan en 001.
 *
 * - Persona natural (tercer dígito del 0 al 5): su cédula válida seguida de 001.
 * - Entidad pública (tercer dígito 6) y sociedad privada o extranjero sin
 *   cédula (tercer dígito 9): una provincia válida y su tercer dígito. Su
 *   dígito verificador no se comprueba: desde 2021 el SRI emite RUCs que no
 *   cumplen el módulo 11, declara válido todo RUC que genera y recomienda
 *   consultar su catastro para saber si uno existe.
 *   https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32
 *
 * `9999999999999` no es un RUC sino el consumidor final (`isConsumidorFinal`).
 *
 * @example isRUC("1790016919001") // true
 */
export const isRUC = (ruc: string): boolean => {
  if (!(THIRTEEN_DIGITS.test(ruc) && ruc.endsWith("001"))) {
    return false;
  }

  if (ruc[2] === "6" || ruc[2] === "9") {
    return isProvince(ruc);
  }

  return isCedula(ruc.slice(0, 10));
};

/**
 * Si un RUC válido es de una persona natural o de una sociedad (entidad
 * pública con tercer dígito 6, o sociedad privada con tercer dígito 9).
 * Devuelve `null` si no es un RUC válido.
 */
export const taxpayerTypeOf = (ruc: string): TaxpayerType | null => {
  if (!isRUC(ruc)) {
    return null;
  }

  return ruc[2] === "6" || ruc[2] === "9" ? "sociedad" : "persona_natural";
};

/** Si un RUC válido es de una sociedad privada o de un extranjero sin cédula (tercer dígito 9). */
export const isLegalEntityRUC = (ruc: string): boolean =>
  isRUC(ruc) && ruc[2] === "9";

/** Si un RUC válido es de una entidad pública (tercer dígito 6). */
export const isPublicEntityRUC = (ruc: string): boolean =>
  isRUC(ruc) && ruc[2] === "6";

/** Si una cédula o un RUC válidos son de una persona natural. */
export const isNaturalPerson = (identification: string): boolean =>
  isCedula(identification) ||
  taxpayerTypeOf(identification) === "persona_natural";

/**
 * La cédula con la que se forma el RUC de una persona natural, o `null` si
 * no es el RUC válido de una persona natural.
 *
 * @example cedulaOfRUC("1710034065001") // "1710034065"
 */
export const cedulaOfRUC = (ruc: string): string | null =>
  taxpayerTypeOf(ruc) === "persona_natural" ? ruc.slice(0, 10) : null;

/**
 * Si dos identificaciones nombran al mismo contribuyente: son iguales, o una
 * es el RUC de una persona natural y la otra la cédula con que se forma. El
 * SRI deja que una persona natural compre con su cédula aunque esté inscrita
 * con su RUC.
 *
 * @example sameTaxpayer("1710034065001", "1710034065") // true
 */
export const sameTaxpayer = (a: string, b: string): boolean =>
  a === b || cedulaOfRUC(a) === b || cedulaOfRUC(b) === a;
