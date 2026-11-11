# Registro de cambios

## 2.0.0

Las reglas siguen ahora lo que publica el SRI, y algunas respuestas cambian.

### Cambios que rompen

- **Solo módulo ES, Node.js 22.12 o posterior.** `require("validator-ec")` carga el módulo ES desde Node.js 22.12. Ya no hay `main`, `module` ni tipos para CommonJS.
- **`isCedula` rechaza la provincia `00` y un tercer dígito del 6 al 9,** que la versión 1 aceptaba. El SRI reserva el 6 y el 9 para los RUCs de entidades públicas y sociedades, así que ninguna cédula los tiene. Lo mismo vale para el RUC de una persona natural formado con esa cédula.
- **`isRUC` ya no comprueba el módulo 11 en los RUCs de entidades públicas (tercer dígito 6).** El SRI dejó de garantizarlo en 2021 para entidades públicas y sociedades, y la versión 1.3.0 solo lo había quitado para las sociedades. Ahora acepta RUCs públicos reales que antes rechazaba.
- **`isRUC` exige que el RUC de una entidad pública o una sociedad empiece por una provincia del 01 al 24,** la de su establecimiento principal. La versión 1 aceptaba cualquier prefijo (`00`, del `25` al `99`), y también `9999999999999`, el consumidor final, que ahora reconoce `isConsumidorFinal`.
- **`isLegalEntityRUC` exige un RUC válido.** Antes solo miraba la longitud y el tercer dígito.

### Novedades

- `taxpayerTypeOf` dice a quién pertenece un RUC: `"persona_natural"`, `"sociedad"` (entidad pública) o `"sociedad_o_extranjero"` (tercer dígito 9, que el SRI usa para sociedades privadas y para extranjeros sin cédula).
- `isPublicEntityRUC`, `isNaturalPerson`, `cedulaOfRUC` y `sameTaxpayer`, para unir el RUC de una persona natural con su cédula.
- `isConsumidorFinal` y la constante `CONSUMIDOR_FINAL`.

### Para migrar

1. **Node.js.** Actualiza a Node.js 22.12 o posterior. Si tu proyecto TypeScript usa `"moduleResolution": "node"` (o `"node10"`), cámbialo a `"node16"`, `"nodenext"` o `"bundler"`: con el antiguo no encuentra los tipos de la versión 2.
2. **Consumidor final.** Donde aceptabas `9999999999999` por medio de `isRUC`, añade `isConsumidorFinal`.
3. **Datos guardados.** Si guardaste identificaciones validadas con la versión 1, vuelve a validarlas: las cédulas (y los RUCs de personas naturales) con provincia `00` o tercer dígito del 6 al 9, y los RUCs de sociedades o entidades públicas que no empiezan por una provincia del 01 al 24, ahora no son válidos.
4. **Extranjeros sin cédula.** Si tratabas todo RUC con tercer dígito 9 como el de una empresa, ten en cuenta que también puede ser de una persona natural extranjera; solo el catastro del SRI lo distingue.

## 1.3.1

- `isCedula` calcula bien el dígito verificador cuando la suma de los nueve primeros dígitos tiene un solo dígito. La versión 1.3.0 redondeaba a la decena desde el primer dígito de la suma, así que rechazaba cédulas válidas como `0100000009` (suma 1, verificador 9).
- Las versiones se publican desde GitHub Actions con la publicación de confianza de npm, con declaración de procedencia.
