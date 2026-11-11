# validator-ec

Validadores de cédula, RUC y código postal ecuatorianos, en TypeScript y sin dependencias, según las reglas que publica el Servicio de Rentas Internas (SRI).

```bash
pnpm add validator-ec
```

También con `npm install validator-ec`, `yarn add validator-ec` o `bun add validator-ec`. Necesita Node.js 22 o posterior y se publica solo como módulo ES; desde Node.js 22.12, `require("validator-ec")` también funciona.

## Uso

```typescript
import { isCedula, isRUC, sameTaxpayer } from "validator-ec";

isCedula("1710034065"); // true
isRUC("1790016919001"); // true
sameTaxpayer("1710034065001", "1710034065"); // true, la misma persona
```

## Validadores

| Función | Devuelve |
| --- | --- |
| `isCedula(cedula)` | Si es una cédula válida: diez dígitos, provincia del 01 al 24 o 30, tercer dígito del 0 al 5 y el dígito verificador del módulo 10. |
| `isRUC(ruc)` | Si es un RUC válido: trece dígitos que terminan en `001`. El de una persona natural es su cédula seguida de `001`; el de una entidad pública (tercer dígito 6) o una sociedad (tercer dígito 9) necesita una provincia válida. |
| `isLegalEntityRUC(ruc)` | Si es el RUC válido de una sociedad privada o de un extranjero sin cédula (tercer dígito 9). |
| `isPublicEntityRUC(ruc)` | Si es el RUC válido de una entidad pública (tercer dígito 6). |
| `taxpayerTypeOf(ruc)` | `"persona_natural"` o `"sociedad"` para un RUC válido; `null` para cualquier otra cosa. |
| `isNaturalPerson(identificacion)` | Si es una cédula válida o el RUC válido de una persona natural. |
| `cedulaOfRUC(ruc)` | La cédula con que se forma el RUC de una persona natural, o `null`. |
| `sameTaxpayer(a, b)` | Si dos identificaciones son del mismo contribuyente: iguales, o el RUC de una persona natural y su cédula. |
| `isConsumidorFinal(identificacion)` | Si es `9999999999999`, la identificación del consumidor final (`CONSUMIDOR_FINAL`). |
| `isZipCode(codigo)` | Si es un código postal válido: seis dígitos que empiezan por una provincia del 01 al 24. |

## Las reglas, y de dónde salen

**Cédula.** El dígito verificador sigue el módulo 10 del SRI: los nueve primeros dígitos se multiplican por 2, 1, 2…, a cada producto mayor que 9 se le resta 9, y el verificador completa la suma hasta la siguiente decena, o es 0 si ya es múltiplo de 10. El tercer dígito va del 0 al 5, porque el SRI reserva el 6 y el 9 para los RUCs de entidades públicas y sociedades.

**RUC de entidades públicas y sociedades.** No se comprueba su dígito verificador. Desde 2021 el SRI emite RUCs que no cumplen el módulo 11, declara válido todo RUC que genera y recomienda consultar su catastro para saber si uno existe ([comunicado del SRI](https://minka.gob.ec/mintel/ge/rutr/gobec_forms/-/issues/32)). Un validador sin conexión solo puede comprobar su forma.

**Consumidor final.** `9999999999999` es el tipo 07 de la tabla 6 de la [ficha técnica de comprobantes electrónicos](https://www.sri.gob.ec/facturacion-electronica) del SRI. No es un RUC: `isRUC` lo rechaza.

## Pasar de la versión 1 a la 2

Ver el [registro de cambios](CHANGELOG.md#200).

## Contribuir

Hace falta [pnpm](https://pnpm.io/). `pnpm install`, y antes de cada pull request a `main`:

```bash
pnpm check        # formato, lint y código sin usar
pnpm check-types  # tipos
pnpm test         # pruebas
pnpm build        # compilación
```

Las pruebas son propiedades con [Hegel](https://hegel.dev/) contra un oráculo escrito en la propia prueba a partir de la regla del SRI. Cada valor fijo cita de dónde sale. [AGENTS.md](AGENTS.md) tiene las reglas completas.

Las versiones se publican solas: una etiqueta `vX.Y.Z` que coincida con `package.json` dispara la publicación en npm desde GitHub Actions, con declaración de procedencia.

## Licencia

Apache 2.0. Ver [LICENSE](LICENSE).
