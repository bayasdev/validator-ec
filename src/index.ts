export {
  cedulaOfRUC,
  FINAL_CONSUMER,
  isCedula,
  isFinalConsumer,
  isNaturalPerson,
  isRUC,
  parseIdentification,
  sameTaxpayer,
  taxpayerTypeOf,
} from "./identification.ts";

export type {
  Identification,
  InvalidReason,
  TaxpayerType,
} from "./identification.ts";

export { isZipCode } from "./zip-code.ts";
