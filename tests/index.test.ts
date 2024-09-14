import { describe, it, expect } from "vitest";
import { isCedula, isRUC, isZipCode } from "../src";

describe("Validador isCedula", () => {
  it("debería retornar true para una cédula válida", () => {
    expect(isCedula("0151314416")).toBe(true); // Provincia 01 (Azuay)
    expect(isCedula("0258192483")).toBe(true); // Provincia 02 (Bolívar)
    expect(isCedula("0356324301")).toBe(true); // Provincia 03 (Cañar)
    expect(isCedula("0435018049")).toBe(true); // Provincia 04 (Carchi)
    expect(isCedula("0529779068")).toBe(true); // Provincia 05 (Cotopaxi)
    expect(isCedula("0617148671")).toBe(true); // Provincia 06 (Chimborazo)
    expect(isCedula("0704023837")).toBe(true); // Provincia 07 (El Oro)
    expect(isCedula("0839254687")).toBe(true); // Provincia 08 (Esmeraldas)
    expect(isCedula("0912164589")).toBe(true); // Provincia 09 (Guayas)
    expect(isCedula("1004298103")).toBe(true); // Provincia 10 (Imbabura)
    expect(isCedula("1148646845")).toBe(true); // Provincia 11 (Loja)
    expect(isCedula("1210093447")).toBe(true); // Provincia 12 (Los Ríos)
    expect(isCedula("1332638731")).toBe(true); // Provincia 13 (Manabí)
    expect(isCedula("1452865817")).toBe(true); // Provincia 14 (Morona Santiago)
    expect(isCedula("1527642936")).toBe(true); // Provincia 15 (Napo)
    expect(isCedula("1649341953")).toBe(true); // Provincia 16 (Pastaza)
    expect(isCedula("1710514942")).toBe(true); // Provincia 17 (Pichincha)
    expect(isCedula("1829466083")).toBe(true); // Provincia 18 (Tungurahua)
    expect(isCedula("1924119926")).toBe(true); // Provincia 19 (Zamora Chinchipe)
    expect(isCedula("2025722865")).toBe(true); // Provincia 20 (Galápagos)
    expect(isCedula("2130541226")).toBe(true); // Provincia 21 (Sucumbíos)
    expect(isCedula("2222802650")).toBe(true); // Provincia 22 (Orellana)
    expect(isCedula("2339505444")).toBe(true); // Provincia 23 (Santo Domingo de los Tsáchilas)
    expect(isCedula("2458172596")).toBe(true); // Provincia 24 (Santa Elena)
    expect(isCedula("3017132667")).toBe(true); // Provincia 30 (Ecuatorianos en el exterior)
  });

  it("debería retornar false para una cédula inválida", () => {
    expect(isCedula("1710034066")).toBe(false);
  });

  it("debería retornar false si la cédula no tiene 10 dígitos", () => {
    expect(isCedula("171003406")).toBe(false);
    expect(isCedula("17100340656")).toBe(false);
  });

  it("debería retornar false para cédulas con código de provincia inválido", () => {
    expect(isCedula("2510034065")).toBe(false);
    expect(isCedula("9910034065")).toBe(false);
  });

  it("debería retornar false para cédulas con caracteres no numéricos", () => {
    expect(isCedula("17A0034065")).toBe(false);
    expect(isCedula("17100X4065")).toBe(false);
    expect(isCedula("17100340-5")).toBe(false);
  });

  it("debería retornar false para una cadena vacía", () => {
    expect(isCedula("")).toBe(false);
  });

  it("debería retornar false si el dígito verificador es incorrecto", () => {
    expect(isCedula("1710034060")).toBe(false);
  });

  it("debería retornar false si la suma total es múltiplo de 10 pero el dígito verificador no coincide", () => {
    expect(isCedula("1710034069")).toBe(false);
  });
});

describe("Validador isRUC", () => {
  it("debería retornar true para un RUC válido de persona natural", () => {
    expect(isRUC("1710034065001")).toBe(true);
  });

  it("debería retornar true para un RUC válido de persona jurídica", () => {
    expect(isRUC("1790016919001")).toBe(true);
    expect(isRUC("0990004196001")).toBe(true);
    expect(isRUC("0190072002001")).toBe(true);
    expect(isRUC("1390012949001")).toBe(true);
  });

  it("debería retornar true para un RUC válido de entidad pública", () => {
    expect(isRUC("1760001550001")).toBe(true);
  });

  it("debería retornar false para un RUC inválido", () => {
    expect(isRUC("1710034065000")).toBe(false);
    expect(isRUC("0990001099000")).toBe(false);
    expect(isRUC("1760001550000")).toBe(false);
  });

  it("debería retornar false si el RUC no tiene 13 dígitos", () => {
    expect(isRUC("17100340650")).toBe(false);
    expect(isRUC("17100340650011")).toBe(false);
  });

  it("debería retornar false para RUCs con caracteres no numéricos", () => {
    expect(isRUC("17A0034065001")).toBe(false);
    expect(isRUC("17100X4065001")).toBe(false);
  });

  it("debería retornar false si el código de establecimiento no es 001", () => {
    expect(isRUC("1710034065000")).toBe(false);
  });
});

describe("Función isZipCode", () => {
  it("debería retornar true para un código postal válido", () => {
    expect(isZipCode("170150")).toBe(true); // Código postal válido de Pichincha
    expect(isZipCode("090112")).toBe(true); // Código postal válido de Guayas
    expect(isZipCode("010203")).toBe(true); // Código postal válido de Azuay
    expect(isZipCode("240205")).toBe(true); // Código postal válido de Santa Elena
    expect(isZipCode("220202")).toBe(true); // Código postal válido de Orellana
  });

  it("debería retornar false si el código postal no tiene 6 dígitos", () => {
    expect(isZipCode("17015")).toBe(false);
    expect(isZipCode("1701500")).toBe(false);
    expect(isZipCode("1701")).toBe(false);
  });

  it("debería retornar false si el código postal contiene caracteres no numéricos", () => {
    expect(isZipCode("17A150")).toBe(false);
    expect(isZipCode("17015X")).toBe(false);
    expect(isZipCode("170-50")).toBe(false);
    expect(isZipCode("17 150")).toBe(false);
    expect(isZipCode("17.150")).toBe(false);
  });

  it("debería retornar false para códigos postales con código de provincia inválido", () => {
    expect(isZipCode("000150")).toBe(false);
    expect(isZipCode("250150")).toBe(false);
    expect(isZipCode("990150")).toBe(false);
  });

  it("debería retornar false para una cadena vacía", () => {
    expect(isZipCode("")).toBe(false);
  });
});
