/**
 * Utilidades para sanitizar y normalizar cadenas de texto que puedan tener
 * problemas de codificación (mojibake) provenientes de importaciones o decodificación errónea.
 */
export function sanitizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/Âª/g, 'ª')
    .replace(/Âº/g, 'º')
    .replace(/SÃ\x8D/g, 'SÍ')
    .replace(/SÃ\u008D/g, 'SÍ')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã\x81/g, 'Á')
    .replace(/Ã\x89/g, 'É')
    .replace(/Ã\x93/g, 'Ó')
    .replace(/Ã\x9A/g, 'Ú')
    .replace(/Ã\x91/g, 'Ñ');
}
