# validator-ec

Valida cédulas, RUCs y códigos postales ecuatorianos con las reglas que publica el SRI.

[![npm](https://img.shields.io/npm/v/validator-ec)](https://www.npmjs.com/package/validator-ec) [![Descargas](https://img.shields.io/npm/dm/validator-ec)](https://www.npmjs.com/package/validator-ec) [![CI](https://github.com/bayasdev/validator-ec/actions/workflows/ci.yml/badge.svg)](https://github.com/bayasdev/validator-ec/actions/workflows/ci.yml) [![Licencia](https://img.shields.io/npm/l/validator-ec)](LICENSE)

```typescript
import { isCedula, isRUC } from "validator-ec";

isCedula("1710034065"); // true
isRUC("1790016919001"); // true
isRUC("9999999999999"); // false, es el consumidor final
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

Necesita Node.js 22 o posterior. Se publica como módulo ES; desde Node.js 22.12, `require("validator-ec")` también funciona. En el navegador funciona con cualquier empaquetador.

## API

Todas las funciones reciben una cadena y nunca lanzan errores: lo que no es válido devuelve `false` o `null`.

### Cédula

#### `isCedula(cedula: string): boolean`

Diez dígitos, una provincia del 01 al 24 o el 30, un tercer dígito del 0 al 5 y el dígito verificador del módulo 10.

```typescript
isCedula("1710034065"); // true
isCedula("1710034060"); // false, el verificador no coincide
```

### RUC

#### `isRUC(ruc: string): boolean`

Trece dígitos que terminan en `001`. El RUC de una persona natural es su cédula seguida de `001`; el de una entidad pública (tercer dígito 6) o una sociedad (tercer dígito 9) necesita una provincia válida.

```typescript
isRUC("1710034065001"); // true, persona natural
isRUC("1760001550001"); // true, entidad pública
isRUC("1790016919001"); // true, sociedad
```

#### `taxpayerTypeOf(ruc: string): "persona_natural" | "sociedad" | null`

A quién pertenece un RUC válido, como lo distinguen las declaraciones del SRI.

```typescript
taxpayerTypeOf("1710034065001"); // "persona_natural"
taxpayerTypeOf("1790016919001"); // "sociedad"
taxpayerTypeOf("1234"); // null
```

#### `isLegalEntityRUC(ruc: string): boolean` y `isPublicEntityRUC(ruc: string): boolean`

Si es el RUC válido de una sociedad privada o un extranjero sin cédula (tercer dígito 9), o de una entidad pública (tercer dígito 6).

#### `isNaturalPerson(identificacion: string): boolean`

Si es una cédula válida o el RUC válido de una persona natural.

### Una persona, dos identificaciones

El SRI deja que una persona natural compre con su cédula aunque esté inscrita con su RUC. Estas funciones las unen.

#### `cedulaOfRUC(ruc: string): string | null`

```typescript
cedulaOfRUC("1710034065001"); // "1710034065"
cedulaOfRUC("1790016919001"); // null, una sociedad no tiene cédula
```

#### `sameTaxpayer(a: string, b: string): boolean`

```typescript
sameTaxpayer("1710034065001", "1710034065"); // true
sameTaxpayer("1790016919001", "1790016919"); // false
```

### Consumidor final

#### `isConsumidorFinal(identificacion: string): boolean` y `CONSUMIDOR_FINAL`

`9999999999999`, la identificación del consumidor final en los comprobantes electrónicos. No es un RUC ni una cédula.

```typescript
isConsumidorFinal("9999999999999"); // true
```

### Código postal

#### `isZipCode(codigo: string): boolean`

Seis dígitos que empiezan por una provincia del 01 al 24.

```typescript
isZipCode("170150"); // true, Pichincha
```

## Las reglas, y de dónde salen

**El dígito verificador de la cédula** sigue el módulo 10 del SRI: los nueve primeros dígitos se multiplican por 2, 1, 2…, a cada producto mayor que 9 se le resta 9, y el verificador completa la suma hasta la siguiente decena, o es 0 si ya es múltiplo de 10. El tercer dígito va del 0 al 5, porque el SRI reserva el 6 y el 9 para los RUCs de entidades públicas y sociedades.

**El RUC de entidades públicas y sociedades** no se comprueba con el módulo 11. Desde 2021 el SRI emite RUCs que no lo cumplen, declara válido todo RUC que genera y recomienda consultar su catastro para saber si uno existe ([comunicado del SRI](https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32)). Sin conexión, solo se puede comprobar su forma; para saber si un RUC existe, consulta el catastro del SRI.

**El consumidor final** es el tipo 07 de la tabla 6 de la [ficha técnica de comprobantes electrónicos](https://www.sri.gob.ec/facturacion-electronica) del SRI.

## Desde la versión 1

La versión 2 cambia algunas respuestas para seguir al SRI. El [registro de cambios](CHANGELOG.md#200) explica cada una y cómo migrar.

## Contribuir

Hace falta [pnpm](https://pnpm.io/). Tras `pnpm install`, antes de cada pull request a `main`:

```bash
pnpm check        # formato, lint y código sin usar
pnpm check-types  # tipos
pnpm test         # pruebas
pnpm build        # compilación
```

Las pruebas son propiedades con [Hegel](https://hegel.dev/) contra un oráculo escrito en la propia prueba a partir de la regla del SRI, y cada valor fijo cita de dónde sale. [AGENTS.md](AGENTS.md) tiene las reglas completas.

Para publicar, sube una etiqueta `vX.Y.Z` que coincida con `package.json`: GitHub Actions publica en npm con la publicación de confianza, sin tokens.

## Licencia

[Apache 2.0](LICENSE)
