// Helper para validar que una cadena contenga únicamente dígitos.
export default function isDigits(value: string): boolean {
  return /^\d+$/.test(value);
}
