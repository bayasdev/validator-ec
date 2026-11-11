import { isProvince } from "./province.ts";

const SIX_DIGITS = /^\d{6}$/u;

/**
 * Las zonas no delimitadas, territorio que dos provincias se disputaban
 * (Manga del Cura, Las Golondrinas, El Piedrero), tienen códigos postales
 * que empiezan por 90, como los que lista GeoNames (900001 a 900004).
 */
const UNDELIMITED_ZONES = "90";

/**
 * Si un valor tiene la forma de un código postal ecuatoriano: seis dígitos
 * que empiezan por una provincia del 01 al 24, o por el 90 de las zonas no
 * delimitadas. Solo comprueba la forma: no hay una lista oficial abierta de
 * los códigos que existen, así que no puede saber si uno existe.
 *
 * @example isZipCode("170102") // true, Gualea (Quito)
 */
export const isZipCode = (zipCode: string): boolean =>
  SIX_DIGITS.test(zipCode) &&
  (isProvince(zipCode) || zipCode.startsWith(UNDELIMITED_ZONES));
