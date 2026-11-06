/**
 * Fechas sin hora ni zona: lo único que necesita un calendario. Todo se calcula
 * en UTC para que la zona del servidor no corra ningún día.
 */

export interface CalendarDate {
  readonly year: number;
  /** 1–12. */
  readonly month: number;
  readonly day: number;
}

/**
 * La zona del «hoy» de la app. Los usuarios están en Colombia: así el día
 * cambia a su medianoche, no a la de Japón ni a la del servidor (UTC en Vercel).
 */
export const APP_TIME_ZONE = 'America/Bogota';

/** La fecha de hoy en `APP_TIME_ZONE`. */
export function today(now: Date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((p) => p.type === type)!.value);
  return { year: part('year'), month: part('month'), day: part('day') };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = domingo … 6 = sábado. */
export function weekdayOf(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

/** El día del mes del `nth` `weekday` (el 2.º lunes de enero = `nthWeekday(año, 1, 1, 2)`). */
export function nthWeekday(year: number, month: number, weekday: number, nth: number): number {
  const first = weekdayOf({ year, month, day: 1 });
  return 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7;
}

/** Número comparable de una fecha dentro del año (`MMDD`), para los rangos. */
export function monthDay(month: number, day: number): number {
  return month * 100 + day;
}

export function sameDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * El día del equinoccio en Japón, que fija 春分の日 y 秋分の日. Es la fórmula
 * aproximada que se usa para 1980–2099; el gobierno confirma la fecha cada
 * febrero del año anterior.
 */
export function equinoxDay(year: number, season: 'spring' | 'autumn'): number {
  const base = season === 'spring' ? 20.8431 : 23.2488;
  const offset = year - 1980;
  return Math.floor(base + 0.242194 * offset - Math.floor(offset / 4));
}
