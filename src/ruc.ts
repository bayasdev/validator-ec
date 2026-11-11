import { isCedula } from "./cedula.ts";
import { isProvince } from "./province.ts";

const THIRTEEN_DIGITS = /^\d{13}$/u;

/**
 * A quién pertenece un RUC, hasta donde su número lo dice:
 *
 * - `"persona_natural"`: su cédula seguida de 001.
 * - `"sociedad"`: una entidad pública (tercer dígito 6).
 * - `"sociedad_o_extranjero"`: una sociedad privada o una persona natural
 *   extranjera sin cédula (tercer dígito 9). El SRI les da la misma forma, y
 *   solo su catastro dice cuál es.
 */
export type TaxpayerType =
  | "persona_natural"
  | "sociedad"
  | "sociedad_o_extranjero";

/**
 * Valida un RUC ecuatoriano: trece dígitos que terminan en 001.
 *
 * - Persona natural (tercer dígito del 0 al 5): su cédula válida seguida de 001.
 * - Entidad pública (tercer dígito 6) y sociedad privada o extranjero sin
 *   cédula (tercer dígito 9): la provincia de su establecimiento principal,
 *   del 01 al 24, y su tercer dígito. Su dígito verificador no se comprueba:
 *   desde 2021 el SRI emite RUCs que no cumplen el módulo 11, declara válido
 *   todo RUC que genera y recomienda consultar su catastro para saber si uno
 *   existe. https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32
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

/** A quién pertenece un RUC válido (`TaxpayerType`), o `null` si no es un RUC válido. */
export const taxpayerTypeOf = (ruc: string): TaxpayerType | null => {
  if (!isRUC(ruc)) {
    return null;
  }

  if (ruc[2] === "9") {
    return "sociedad_o_extranjero";
  }

  return ruc[2] === "6" ? "sociedad" : "persona_natural";
};

/** Si un RUC válido es de una sociedad privada o de un extranjero sin cédula (tercer dígito 9). */
export const isLegalEntityRUC = (ruc: string): boolean =>
  taxpayerTypeOf(ruc) === "sociedad_o_extranjero";

/** Si un RUC válido es de una entidad pública (tercer dígito 6). */
export const isPublicEntityRUC = (ruc: string): boolean =>
  taxpayerTypeOf(ruc) === "sociedad";

/**
 * Si una cédula válida o un RUC válido son, con certeza, de una persona
 * natural. El RUC de un extranjero sin cédula (tercer dígito 9) no cuenta:
 * su número no lo distingue del de una sociedad.
 */
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

const isIdentification = (value: string) => isCedula(value) || isRUC(value);

/**
 * Si dos cédulas o RUCs válidos nombran al mismo contribuyente: son iguales,
 * o uno es el RUC de una persona natural y el otro la cédula con que se
 * forma. El SRI deja que una persona natural compre con su cédula aunque
 * esté inscrita con su RUC. Lo que no es una identificación válida no es el
 * mismo contribuyente que nada.
 *
 * @example sameTaxpayer("1710034065001", "1710034065") // true
 */
export const sameTaxpayer = (a: string, b: string): boolean =>
  isIdentification(a) &&
  isIdentification(b) &&
  (a === b || cedulaOfRUC(a) === b || cedulaOfRUC(b) === a);
