# validator-ec

**validator-ec** es una colección de validadores de datos para Ecuador desarrollada en TypeScript. Actualmente, solo cuenta con un validador para cédulas de identidad ecuatorianas pero se espera agregar más validadores en el futuro.

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

| Validador                           | Descripción                                                                                                  | Ejemplo                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `isCedula(cedula: string): boolean` | Valida una cédula ecuatoriana de identidad. Devuelve `true` si la cédula es válida, de lo contrario `false`. | `isCedula('1710034065')` |

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
