/**
 * El kanji llega en la URL codificado (`%E6%97%A5`). Se decodifica sin fiarse
 * de si Next ya lo hizo: decodificar un kanji no lo cambia, y una secuencia
 * `%` inválida se deja como está para que la API responda 400.
 */
export function characterFromParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
