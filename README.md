<p align="center">
  <img src="https://raw.githubusercontent.com/bayasdev/validator-ec/main/.github/banner.png" alt="validator-ec: cédula, RUC y código postal ecuatorianos" width="720">
</p>

# validator-ec

Valida cédulas, RUCs y códigos postales ecuatorianos con las reglas que publica el SRI.

[![npm](https://img.shields.io/npm/v/validator-ec)](https://www.npmjs.com/package/validator-ec) [![Descargas](https://img.shields.io/npm/dm/validator-ec)](https://www.npmjs.com/package/validator-ec) [![CI](https://github.com/bayasdev/validator-ec/actions/workflows/ci.yml/badge.svg)](https://github.com/bayasdev/validator-ec/actions/workflows/ci.yml) [![Licencia](https://img.shields.io/npm/l/validator-ec)](https://github.com/bayasdev/validator-ec/blob/main/LICENSE)

```typescript
import { isCedula, isRUC, parseIdentification } from "validator-ec";

isCedula("1710034065"); // true
isRUC("1790016919001"); // true
isRUC("9999999999999"); // false, es el consumidor final
parseIdentification("1710034060"); // { ok: false, reason: "digito_verificador" }
```

- **Fiel al SRI.** Cada regla cita de dónde sale, y no inventa un dígito verificador que el SRI ya no garantiza.
- **No rechaza a contribuyentes reales.** Acepta los RUCs de sociedades y entidades públicas que el SRI emite sin cumplir el módulo 11.
- **Probado con propiedades.** Cientos de casos generados por prueba, contra un oráculo escrito aparte a partir de la regla.
- **Pequeño.** Sin dependencias, con tipos incluidos, y menos de 1 kB minificado y comprimido.
- **Publicado con procedencia.** Cada versión sale de GitHub Actions con una declaración de procedencia de npm que puedes verificar.

## Instalación

```bash
pnpm add validator-ec
```

O con `npm install validator-ec`, `yarn add validator-ec` o `bun add validator-ec`.

Necesita Node.js 22.12 o posterior. Se publica como módulo ES, y `require("validator-ec")` también lo carga. En el navegador funciona con cualquier empaquetador.

## API

Todas las funciones reciben una cadena y nunca lanzan errores.

### Leer una identificación

#### `parseIdentification(valor: string): Identification`

Lee una cédula, un RUC o el consumidor final de una vez, y dice qué es o por qué no es válido. Es lo que usan todas las demás funciones, y lo que necesita un formulario para explicar el error.

```typescript
parseIdentification("1710034065"); // { ok: true, kind: "cedula", taxpayer: "persona_natural" }
parseIdentification("1790016919001"); // { ok: true, kind: "ruc", taxpayer: "sociedad_o_extranjero" }
parseIdentification("9999999999999"); // { ok: true, kind: "consumidor_final" }
parseIdentification("1710034060"); // { ok: false, reason: "digito_verificador" }
```

| `reason` | Qué falla |
| --- | --- |
| `"longitud"` | No tiene 10 ni 13 caracteres. |
| `"caracteres"` | Tiene algo que no es un dígito. |
| `"provincia"` | No empieza por una provincia que pueda emitirlo: del 01 al 24, o el 30 en una cédula. |
| `"tercer_digito"` | El tercer dígito no corresponde a ningún tipo de contribuyente. |
| `"digito_verificador"` | El verificador de la cédula no cumple el módulo 10. |
| `"establecimiento"` | Un RUC que no termina en `001`. |

`taxpayer` dice a quién pertenece, hasta donde el número lo dice: `"persona_natural"` (una cédula o su RUC), `"sociedad"` (una entidad pública, tercer dígito 6) o `"sociedad_o_extranjero"` (tercer dígito 9: una sociedad privada o una persona natural extranjera sin cédula, que solo el catastro del SRI distingue).

### Preguntas de sí o no

```typescript
isCedula("1710034065"); // true
isRUC("1760001550001"); // true, entidad pública
isFinalConsumer("9999999999999"); // true
isNaturalPerson("1710034065001"); // true
taxpayerTypeOf("1790016919001"); // "sociedad_o_extranjero"
```

| Función | Devuelve |
| --- | --- |
| `isCedula(valor)` | Si es una cédula válida. |
| `isRUC(valor)` | Si es un RUC válido. El consumidor final no lo es. |
| `isFinalConsumer(valor)` | Si es `9999999999999` (`FINAL_CONSUMER`), el consumidor final de los comprobantes electrónicos. |
| `taxpayerTypeOf(ruc)` | El `taxpayer` de un RUC válido, o `null`. |
| `isNaturalPerson(valor)` | Si es, con certeza, de una persona natural: una cédula válida o su RUC. |

### Una persona, dos identificaciones

El SRI deja que una persona natural compre con su cédula aunque esté inscrita con su RUC. Estas funciones las unen.

```typescript
cedulaOfRUC("1710034065001"); // "1710034065"
cedulaOfRUC("1790016919001"); // null, una sociedad no tiene cédula
sameTaxpayer("1710034065001", "1710034065"); // true
sameTaxpayer("1790016919001", "1790016919"); // false
```

`sameTaxpayer` nunca une dos valores que no son cédulas o RUCs válidos.

### Código postal

#### `isZipCode(codigo: string): boolean`

Si tiene la forma de un código postal ecuatoriano: seis dígitos que empiezan por una provincia del 01 al 24, o por el 90 de las zonas no delimitadas. Es independiente de las identificaciones.

```typescript
isZipCode("170102"); // true, Gualea (Quito)
isZipCode("900003"); // true, Manga del Cura
```

Solo comprueba la forma. No hay una lista oficial abierta de los códigos que existen, así que no puede decir si un código existe: para eso, consulta a la Agencia Nacional Postal. Las pruebas comprueban que acepta los 1.225 códigos ecuatorianos que lista [GeoNames](https://www.geonames.org/).

## Las reglas, y de dónde salen

**El dígito verificador de la cédula** sigue el módulo 10 del SRI: los nueve primeros dígitos se multiplican por 2, 1, 2…, a cada producto mayor que 9 se le resta 9, y el verificador completa la suma hasta la siguiente decena, o es 0 si ya es múltiplo de 10. El tercer dígito va del 0 al 5, porque el SRI reserva el 6 y el 9 para los RUCs de entidades públicas y sociedades.

**El RUC de entidades públicas y sociedades** no se comprueba con el módulo 11. Desde 2021 el SRI emite RUCs que no lo cumplen, declara válido todo RUC que genera y recomienda consultar su catastro para saber si uno existe ([comunicado del SRI](https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32)). Sin conexión, solo se puede comprobar su forma; para saber si un RUC existe, consulta el catastro del SRI.

**El consumidor final** es el tipo 07 de la tabla 6 de la [ficha técnica de comprobantes electrónicos](https://www.sri.gob.ec/facturacion-electronica) del SRI.

## Desde la versión 1

La versión 2 cambia algunas respuestas para seguir al SRI. El [registro de cambios](https://github.com/bayasdev/validator-ec/blob/main/CHANGELOG.md#200) explica cada una y cómo migrar.

## Contribuir

Hace falta [pnpm](https://pnpm.io/). Tras `pnpm install`, antes de cada pull request a `main`:

```bash
pnpm check        # formato, lint y código sin usar
pnpm check-types  # tipos
pnpm test         # pruebas
pnpm build        # compilación
```

Las pruebas son propiedades con [Hegel](https://hegel.dev/) contra un oráculo escrito en la propia prueba a partir de la regla del SRI, y cada valor fijo cita de dónde sale. [AGENTS.md](https://github.com/bayasdev/validator-ec/blob/main/AGENTS.md) tiene las reglas completas.

Para publicar, sube una etiqueta `vX.Y.Z` que coincida con `package.json`: GitHub Actions publica en npm con la publicación de confianza, sin tokens.

## In English

validator-ec validates Ecuadorian cédulas, RUCs (tax IDs) and postal codes with the rules Ecuador's tax authority, the SRI, publishes. It has no dependencies and ships its own types.

```typescript
import { isCedula, isRUC, parseIdentification } from "validator-ec";

isCedula("1710034065"); // true
isRUC("1790016919001"); // true
parseIdentification("1710034060"); // { ok: false, reason: "digito_verificador" }
```

Function names are English; the values they return use the SRI's Spanish terms (`"persona_natural"`, `"digito_verificador"`), so they match the SRI's own documents. The API reference above applies as written.

## Licencia

[Apache 2.0](https://github.com/bayasdev/validator-ec/blob/main/LICENSE). La lista de códigos postales con que se prueba `isZipCode` (`tests/data`) es de [GeoNames](https://www.geonames.org/), bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
