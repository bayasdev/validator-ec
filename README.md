# validator-ec

Colección de validadores de datos comunes en Ecuador desarrollada en TypeScript.

Actualmente, cuenta con validadores para cédulas de identidad ecuatorianas, números de RUC (Registro Único de Contribuyentes) y códigos postales.

## Características

- Compatibilidad con TypeScript y JavaScript (ES Modules y CommonJS).
- Fácil integración en cualquier proyecto frontend o backend.
- Extensible, permitiendo agregar más validadores en el futuro.

## Instalación

Puedes instalar **validator-ec** utilizando el gestor de paquetes que prefieras.

### Bun

```bash
bun add validator-ec
```

### Yarn

```bash
yarn add validator-ec
```

### NPM

```bash
npm install validator-ec
```

## Validadores

| Validador                             | Descripción                                                                                                               | Ejemplo                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `isCedula(cedula: string): boolean`   | Valida una cédula de identidad ecuatoriana. Devuelve `true` si la cédula es válida, de lo contrario `false`.              | `isCedula('1710034065')` |
| `isRUC(ruc: string): boolean`         | Valida un número de RUC (Registro Único de Contribuyentes). Devuelve `true` si el RUC es válido, de lo contrario `false`. | `isRUC('1790016919001')` |
| `isZipCode(zipCode: string): boolean` | Valida un código postal ecuatoriano. Devuelve `true` si el código postal es válido, de lo contrario `false`.              | `isZipCode('131401')`    |

## Uso

### TypeScript

```typescript
import { isCedula } from "validator-ec";

// Validar una cédula
const cedula = "1710034065";
const isValid = isCedula(cedula);

if (isValid) {
  console.log("La cédula es válida");
} else {
  console.log("La cédula no es válida");
}
```

### JavaScript (CommonJS)

```javascript
const { isCedula } = require("validator-ec");

// Validar una cédula
const cedula = "1710034065";
const isValid = isCedula(cedula);

if (isValid) {
  console.log("La cédula es válida");
} else {
  console.log("La cédula no es válida");
}
```

## Contribuir

Todas las contribuciones son bienvenidas. Si deseas contribuir al proyecto, asegúrate de tener instalado [Bun](https://bun.sh/) antes de seguir los siguientes pasos:

1. Crea un fork del proyecto.
2. Crea una nueva rama con el nombre de la funcionalidad que deseas agregar.
3. Instala las dependencias del proyecto con `bun install`.
4. Realiza los cambios necesarios.
5. Agrega pruebas para la nueva funcionalidad.
6. Realiza un pull request a la rama `master`.

## Pruebas

Para ejecutar las pruebas del proyecto con [Vitest](https://vitest.dev/), utiliza el siguiente comando:

```bash
bun run test
```

## Construir el proyecto

Para construir el proyecto con [tsup](https://tsup.egoist.dev/), utiliza el siguiente comando:

```bash
bun run build
```

## Autores

- [Victor Bayas](https://github.com/bayasdev)

## Licencia

Este proyecto está liberado bajo la licencia Apache 2.0. Para más información, revisa el archivo [LICENSE](LICENSE.md).
