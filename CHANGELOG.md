# Registro de cambios

## 2.0.0

Las reglas siguen ahora lo que publica el SRI, y algunas respuestas cambian.

### Cambios que rompen

- **Solo módulo ES, Node.js 22 o posterior.** Desde Node.js 22.12, `require("validator-ec")` carga el módulo ES; en versiones anteriores, usa `import`.
- **`isCedula` rechaza la provincia `00` y un tercer dígito del 6 al 9.** La versión 1 los aceptaba. El SRI reserva el 6 y el 9 para los RUCs de entidades públicas y sociedades, así que ninguna cédula los tiene.
- **`isRUC` ya no comprueba el módulo 11 en los RUCs de entidades públicas (tercer dígito 6).** El SRI dejó de garantizarlo en 2021 para entidades públicas y sociedades, y la versión 1.3.0 solo lo había quitado para las sociedades. Ahora acepta RUCs públicos reales que antes rechazaba.
- **`isRUC` exige una provincia válida a los RUCs de entidades públicas y sociedades,** y por eso rechaza `9999999999999`, el consumidor final, que la versión 1 aceptaba como RUC. Usa `isConsumidorFinal` para reconocerlo.
- **`isLegalEntityRUC` exige un RUC válido.** Antes solo miraba la longitud y el tercer dígito.

### Novedades

- `isPublicEntityRUC`, `taxpayerTypeOf`, `isNaturalPerson`, `cedulaOfRUC` y `sameTaxpayer`, para saber a quién pertenece un RUC y unir el RUC de una persona natural con su cédula.
- `isConsumidorFinal` y la constante `CONSUMIDOR_FINAL`.
- Pruebas de propiedades con Hegel contra un oráculo escrito a partir de la regla del SRI.

### Para migrar

1. Si usas CommonJS en Node.js anterior a 22.12, cambia `require` por `import` o actualiza Node.js.
2. Donde aceptabas `9999999999999` por medio de `isRUC`, añade `isConsumidorFinal`.
3. Si guardabas RUCs públicos que la versión 1 rechazaba por el módulo 11, ahora son válidos.

## 1.3.1

- `isCedula` calcula bien el dígito verificador cuando la suma de los nueve primeros dígitos tiene un solo dígito. La versión 1.3.0 redondeaba a la decena desde el primer dígito de la suma, así que rechazaba cédulas válidas como `0100000009` (suma 1, verificador 9).
- Las versiones se publican desde GitHub Actions con la publicación de confianza de npm, con declaración de procedencia.
