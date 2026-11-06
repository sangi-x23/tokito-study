/**
 * Cómo se dicen en japonés las partes de una fecha: meses, días de la semana y
 * días del mes. Es lo que el calendario pone a practicar.
 */

export interface JapaneseLabel {
  readonly japanese: string;
  readonly reading: string;
}

export interface CalendarMonth extends JapaneseLabel {
  /** 1–12. */
  readonly month: number;
  /** El de la URL: `/calendario/enero`. */
  readonly slug: string;
  readonly spanish: string;
}

/** Los meses son el número más 月; 四月, 七月 y 九月 tienen lectura propia. */
export const CALENDAR_MONTHS: readonly CalendarMonth[] = [
  {
    month: 1,
    slug: 'enero',
    spanish: 'Enero',
    japanese: '一月',
    reading: 'いちがつ',
  },
  {
    month: 2,
    slug: 'febrero',
    spanish: 'Febrero',
    japanese: '二月',
    reading: 'にがつ',
  },
  {
    month: 3,
    slug: 'marzo',
    spanish: 'Marzo',
    japanese: '三月',
    reading: 'さんがつ',
  },
  {
    month: 4,
    slug: 'abril',
    spanish: 'Abril',
    japanese: '四月',
    reading: 'しがつ',
  },
  {
    month: 5,
    slug: 'mayo',
    spanish: 'Mayo',
    japanese: '五月',
    reading: 'ごがつ',
  },
  {
    month: 6,
    slug: 'junio',
    spanish: 'Junio',
    japanese: '六月',
    reading: 'ろくがつ',
  },
  {
    month: 7,
    slug: 'julio',
    spanish: 'Julio',
    japanese: '七月',
    reading: 'しちがつ',
  },
  {
    month: 8,
    slug: 'agosto',
    spanish: 'Agosto',
    japanese: '八月',
    reading: 'はちがつ',
  },
  {
    month: 9,
    slug: 'septiembre',
    spanish: 'Septiembre',
    japanese: '九月',
    reading: 'くがつ',
  },
  {
    month: 10,
    slug: 'octubre',
    spanish: 'Octubre',
    japanese: '十月',
    reading: 'じゅうがつ',
  },
  {
    month: 11,
    slug: 'noviembre',
    spanish: 'Noviembre',
    japanese: '十一月',
    reading: 'じゅういちがつ',
  },
  {
    month: 12,
    slug: 'diciembre',
    spanish: 'Diciembre',
    japanese: '十二月',
    reading: 'じゅうにがつ',
  },
];

export function findMonthBySlug(slug: string): CalendarMonth | null {
  return CALENDAR_MONTHS.find((entry) => entry.slug === slug) ?? null;
}

export function findMonth(month: number): CalendarMonth {
  return CALENDAR_MONTHS[month - 1]!;
}

export interface Weekday extends JapaneseLabel {
  /** El kanji solo, como encabeza las columnas de un calendario japonés. */
  readonly short: string;
  readonly spanish: string;
}

/** Empieza en domingo, como los calendarios japoneses (y `Date.getUTCDay()`). */
export const WEEKDAYS: readonly Weekday[] = [
  {
    short: '日',
    japanese: '日曜日',
    reading: 'にちようび',
    spanish: 'Domingo',
  },
  { short: '月', japanese: '月曜日', reading: 'げつようび', spanish: 'Lunes' },
  { short: '火', japanese: '火曜日', reading: 'かようび', spanish: 'Martes' },
  {
    short: '水',
    japanese: '水曜日',
    reading: 'すいようび',
    spanish: 'Miércoles',
  },
  { short: '木', japanese: '木曜日', reading: 'もくようび', spanish: 'Jueves' },
  {
    short: '金',
    japanese: '金曜日',
    reading: 'きんようび',
    spanish: 'Viernes',
  },
  { short: '土', japanese: '土曜日', reading: 'どようび', spanish: 'Sábado' },
];

export interface DayOfMonth extends JapaneseLabel {
  readonly day: number;
  /** Lectura que no sale de leer el número más にち: hay que memorizarla. */
  readonly irregular: boolean;
}

/** Del 1 al 10 los días usan la numeración japonesa nativa; después, el número más にち, con excepciones. */
const IRREGULAR_READINGS: Readonly<Record<number, string>> = {
  1: 'ついたち',
  2: 'ふつか',
  3: 'みっか',
  4: 'よっか',
  5: 'いつか',
  6: 'むいか',
  7: 'なのか',
  8: 'ようか',
  9: 'ここのか',
  10: 'とおか',
  14: 'じゅうよっか',
  20: 'はつか',
  24: 'にじゅうよっか',
};

const DIGITS = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'しち', 'はち', 'く'];

function regularReading(day: number): string {
  const tens = Math.floor(day / 10);
  const units = day % 10;
  const tensReading = tens === 0 ? '' : `${tens === 1 ? '' : DIGITS[tens]}じゅう`;
  return `${tensReading}${DIGITS[units]}にち`;
}

/** El día del mes (1–31) como se escribe y se lee: `20日`, はつか. */
export function dayOfMonth(day: number): DayOfMonth {
  const irregular = IRREGULAR_READINGS[day];
  return {
    day,
    japanese: `${day}日`,
    reading: irregular ?? regularReading(day),
    irregular: irregular !== undefined,
  };
}
