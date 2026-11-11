# Changelog

## 1.3.1

- `isCedula` calcula bien el dígito verificador cuando la suma de los nueve primeros dígitos tiene un solo dígito. La versión 1.3.0 redondeaba a la decena desde el primer dígito de la suma, así que rechazaba cédulas válidas como `0100000009` (suma 1, verificador 9).
- Las versiones se publican desde GitHub Actions con la publicación de confianza de npm, con declaración de procedencia.
