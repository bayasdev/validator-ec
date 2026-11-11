import { isCedulaProvince, isProvince } from "./province.ts";

/**
 * La identificación del consumidor final en los comprobantes electrónicos
 * (tipo 07 de la tabla 6 de la ficha técnica del SRI, versión 2.22).
 */
export const FINAL_CONSUMER = "9999999999999";

/**
 * A quién pertenece una identificación, hasta donde su número lo dice:
 *
 * - `"persona_natural"`: una cédula, o su RUC (la cédula seguida de 001).
 * - `"sociedad"`: una entidad pública (RUC con tercer dígito 6).
 * - `"sociedad_o_extranjero"`: una sociedad privada o una persona natural
 *   extranjera sin cédula (RUC con tercer dígito 9). El SRI les da la misma
 *   forma, y solo su catastro dice cuál es.
 */
export type TaxpayerType =
  | "persona_natural"
  | "sociedad"
  | "sociedad_o_extranjero";

/** Por qué un valor no es una identificación válida. */
export type InvalidReason =
  /** No tiene 10 ni 13 caracteres. */
  | "longitud"
  /** Tiene algo que no es un dígito. */
  | "caracteres"
  /** No empieza por una provincia que pueda emitirlo. */
  | "provincia"
  /** Su tercer dígito no corresponde a ningún tipo de contribuyente. */
  | "tercer_digito"
  /** El dígito verificador de la cédula no cumple el módulo 10. */
  | "digito_verificador"
  /** Un RUC que no termina en 001. */
  | "establecimiento";

/** Lo que es una identificación ecuatoriana, o por qué no lo es. */
export type Identification =
  | { ok: true; kind: "cedula"; taxpayer: "persona_natural" }
  | { ok: true; kind: "ruc"; taxpayer: TaxpayerType }
  | { ok: true; kind: "consumidor_final" }
  | { ok: false; reason: InvalidReason };

const DIGITS = /^\d+$/u;

const invalid = (reason: InvalidReason): Identification => ({
  ok: false,
  reason,
});

/**
 * Lo que impide que diez dígitos sean una cédula, o `null`: la provincia
 * (del 01 al 24, o el 30 de los ecuatorianos en el exterior), el tercer
 * dígito (del 0 al 5; el SRI reserva el 6 y el 9 para RUCs de entidades
 * públicas y sociedades) y el dígito verificador del módulo 10. Los
 * coeficientes 2, 1, 2… se aplican a los nueve primeros dígitos, a cada
 * producto mayor que 9 se le resta 9, y el verificador completa la suma
 * hasta la siguiente decena.
 */
const cedulaProblem = (ten: string): InvalidReason | null => {
  if (!isCedulaProvince(ten)) {
    return "provincia";
  }

  if (Number(ten[2]) > 5) {
    return "tercer_digito";
  }

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    const product = Number(ten[index]) * (index % 2 === 0 ? 2 : 1);
    sum += product > 9 ? product - 9 : product;
  }

  return Number(ten[9]) === (10 - (sum % 10)) % 10
    ? null
    : "digito_verificador";
};

/**
 * Lee una identificación ecuatoriana: una cédula, un RUC o el consumidor
 * final, o por qué no es ninguno.
 *
 * Un RUC son trece dígitos que terminan en 001. El de una persona natural
 * es su cédula seguida de 001. El de una entidad pública (tercer dígito 6)
 * o una sociedad privada o extranjero sin cédula (tercer dígito 9) empieza
 * por la provincia de su establecimiento principal, del 01 al 24, y su
 * dígito verificador no se comprueba: desde 2021 el SRI emite RUCs que no
 * cumplen el módulo 11, declara válido todo RUC que genera y recomienda
 * consultar su catastro para saber si uno existe.
 * https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32
 *
 * @example parseIdentification("1790016919001")
 * // { ok: true, kind: "ruc", taxpayer: "sociedad_o_extranjero" }
 * @example parseIdentification("1710034060")
 * // { ok: false, reason: "digito_verificador" }
 */
export const parseIdentification = (value: string): Identification => {
  if (value.length !== 10 && value.length !== 13) {
    return invalid("longitud");
  }

  if (!DIGITS.test(value)) {
    return invalid("caracteres");
  }

  if (value === FINAL_CONSUMER) {
    return { kind: "consumidor_final", ok: true };
  }

  if (value.length === 10) {
    const problem = cedulaProblem(value);

    return problem === null
      ? { kind: "cedula", ok: true, taxpayer: "persona_natural" }
      : invalid(problem);
  }

  if (!value.endsWith("001")) {
    return invalid("establecimiento");
  }

  if (value[2] === "6" || value[2] === "9") {
    if (!isProvince(value)) {
      return invalid("provincia");
    }

    return {
      kind: "ruc",
      ok: true,
      taxpayer: value[2] === "6" ? "sociedad" : "sociedad_o_extranjero",
    };
  }

  const problem = cedulaProblem(value.slice(0, 10));

  return problem === null
    ? { kind: "ruc", ok: true, taxpayer: "persona_natural" }
    : invalid(problem);
};

/** Si es una cédula válida. @example isCedula("1710034065") // true */
export const isCedula = (value: string): boolean => {
  const read = parseIdentification(value);

  return read.ok && read.kind === "cedula";
};

/** Si es un RUC válido. @example isRUC("1790016919001") // true */
export const isRUC = (value: string): boolean => {
  const read = parseIdentification(value);

  return read.ok && read.kind === "ruc";
};

/** Si es `9999999999999`, el consumidor final. No es un RUC ni una cédula. */
export const isFinalConsumer = (value: string): boolean =>
  value === FINAL_CONSUMER;

/** A quién pertenece un RUC válido (`TaxpayerType`), o `null` si no es un RUC válido. */
export const taxpayerTypeOf = (ruc: string): TaxpayerType | null => {
  const read = parseIdentification(ruc);

  return read.ok && read.kind === "ruc" ? read.taxpayer : null;
};

/**
 * Si una cédula válida o un RUC válido son, con certeza, de una persona
 * natural. El RUC de un extranjero sin cédula (tercer dígito 9) no cuenta:
 * su número no lo distingue del de una sociedad.
 */
export const isNaturalPerson = (value: string): boolean => {
  const read = parseIdentification(value);

  return read.ok && read.kind !== "consumidor_final"
    ? read.taxpayer === "persona_natural"
    : false;
};

/**
 * La cédula con la que se forma el RUC de una persona natural, o `null` si
 * no es el RUC válido de una persona natural.
 *
 * @example cedulaOfRUC("1710034065001") // "1710034065"
 */
export const cedulaOfRUC = (ruc: string): string | null =>
  taxpayerTypeOf(ruc) === "persona_natural" ? ruc.slice(0, 10) : null;

const isTaxpayer = (value: string) => {
  const read = parseIdentification(value);

  return read.ok && read.kind !== "consumidor_final";
};

/**
 * Si dos cédulas o RUCs válidos nombran al mismo contribuyente: son iguales,
 * o uno es el RUC de una persona natural y el otro la cédula con que se
 * forma. El SRI deja que una persona natural compre con su cédula aunque
 * esté inscrita con su RUC. Lo que no es una cédula o un RUC válidos no es
 * el mismo contribuyente que nada.
 *
 * @example sameTaxpayer("1710034065001", "1710034065") // true
 */
export const sameTaxpayer = (a: string, b: string): boolean =>
  isTaxpayer(a) &&
  isTaxpayer(b) &&
  (a === b || cedulaOfRUC(a) === b || cedulaOfRUC(b) === a);
