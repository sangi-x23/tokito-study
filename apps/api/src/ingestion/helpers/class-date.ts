// Las pestañas de clase empiezan por la fecha: `7/10 はじめまして`.
const TITLE_DATE = /^\s*(\d{1,2})\/(\d{1,2})(?!\d)/;

/**
 * Fecha de la clase a partir del título de la pestaña, o null si no la trae.
 *
 * El título no dice el año, así que se toma el de `now`, o el anterior si la
 * fecha quedaría en el futuro: una clase de diciembre leída en enero es del
 * año pasado. Se devuelve a medianoche UTC; solo importa el día.
 */
export function parseClassDate(title: string, now: Date = new Date()): Date | null {
  const match = TITLE_DATE.exec(title);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const build = (year: number): Date | null => {
    const date = new Date(Date.UTC(year, month - 1, day));
    // Date.UTC desborda en silencio (2/31 → 3 de marzo): se descarta.
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  };

  const year = now.getUTCFullYear();
  const candidate = build(year);
  if (!candidate) {
    return null;
  }

  return candidate.getTime() > now.getTime() ? build(year - 1) : candidate;
}
