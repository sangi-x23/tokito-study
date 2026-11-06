import { type CalendarDate, equinoxDay, monthDay, nthWeekday } from './calendar-dates';
import type { JapaneseLabel } from './japanese-dates';

interface MonthDay {
  readonly month: number;
  readonly day: number;
}

export interface CulturalDay extends JapaneseLabel {
  readonly slug: string;
  readonly spanish: string;
  /** Feriado nacional (国民の祝日). Los demás son celebraciones sin día libre. */
  readonly holiday: boolean;
  /**
   * Día temático: mientras dura, la interfaz de todo el sitio usa su tema
   * (`styles/themes/<slug>.css`).
   */
  readonly themed?: boolean;
  /** Cuándo cae en un año dado. `end` solo en las que duran varios días. */
  readonly dates: (year: number) => {
    readonly start: MonthDay;
    readonly end?: MonthDay;
  };
}

const on = (month: number, day: number) => (): { start: MonthDay } => ({
  start: { month, day },
});
const between = (start: MonthDay, end: MonthDay) => (): { start: MonthDay; end: MonthDay } => ({ start, end });
const nthMonday =
  (month: number, nth: number) =>
  (year: number): { start: MonthDay } => ({
    start: { month, day: nthWeekday(year, month, 1, nth) },
  });

/**
 * Los feriados nacionales de Japón y las celebraciones culturales más
 * conocidas, en orden del año. No incluye los feriados de reemplazo
 * (振替休日) ni las fechas lunares como お月見, que cambian cada año.
 */
export const CULTURAL_DAYS: readonly CulturalDay[] = [
  {
    slug: 'ganjitsu',
    japanese: '元日',
    reading: 'がんじつ',
    spanish: 'Año Nuevo',
    holiday: true,
    dates: on(1, 1),
  },
  {
    slug: 'shogatsu',
    japanese: 'お正月',
    reading: 'おしょうがつ',
    spanish: 'Los primeros días del año',
    holiday: false,
    themed: true,
    dates: between({ month: 1, day: 1 }, { month: 1, day: 3 }),
  },
  {
    slug: 'seijin-no-hi',
    japanese: '成人の日',
    reading: 'せいじんのひ',
    spanish: 'Día de la Mayoría de Edad',
    holiday: true,
    dates: nthMonday(1, 2),
  },
  {
    slug: 'setsubun',
    japanese: '節分',
    reading: 'せつぶん',
    spanish: 'Víspera de la primavera',
    holiday: false,
    themed: true,
    dates: on(2, 3),
  },
  {
    slug: 'kenkoku-kinen-no-hi',
    japanese: '建国記念の日',
    reading: 'けんこくきねんのひ',
    spanish: 'Día de la Fundación Nacional',
    holiday: true,
    dates: on(2, 11),
  },
  {
    slug: 'tenno-tanjobi',
    japanese: '天皇誕生日',
    reading: 'てんのうたんじょうび',
    spanish: 'Cumpleaños del Emperador',
    holiday: true,
    dates: on(2, 23),
  },
  {
    slug: 'hinamatsuri',
    japanese: 'ひな祭り',
    reading: 'ひなまつり',
    spanish: 'Día de las Niñas',
    holiday: false,
    themed: true,
    dates: on(3, 3),
  },
  {
    slug: 'shunbun-no-hi',
    japanese: '春分の日',
    reading: 'しゅんぶんのひ',
    spanish: 'Equinoccio de primavera',
    holiday: true,
    dates: (year) => ({ start: { month: 3, day: equinoxDay(year, 'spring') } }),
  },
  {
    slug: 'hanami',
    japanese: 'お花見',
    reading: 'おはなみ',
    spanish: 'Temporada de los cerezos en flor',
    holiday: false,
    themed: true,
    // La floración cambia cada año y según la región: es la de Tokio en un año típico.
    dates: between({ month: 3, day: 25 }, { month: 4, day: 7 }),
  },
  {
    slug: 'showa-no-hi',
    japanese: '昭和の日',
    reading: 'しょうわのひ',
    spanish: 'Día de Shōwa',
    holiday: true,
    dates: on(4, 29),
  },
  {
    slug: 'kenpo-kinenbi',
    japanese: '憲法記念日',
    reading: 'けんぽうきねんび',
    spanish: 'Día de la Constitución',
    holiday: true,
    dates: on(5, 3),
  },
  {
    slug: 'midori-no-hi',
    japanese: 'みどりの日',
    reading: 'みどりのひ',
    spanish: 'Día Verde',
    holiday: true,
    dates: on(5, 4),
  },
  {
    slug: 'kodomo-no-hi',
    japanese: 'こどもの日',
    reading: 'こどものひ',
    spanish: 'Día de los Niños',
    holiday: true,
    themed: true,
    dates: on(5, 5),
  },
  {
    slug: 'tanabata',
    japanese: '七夕',
    reading: 'たなばた',
    spanish: 'Festival de las Estrellas',
    holiday: false,
    themed: true,
    dates: on(7, 7),
  },
  {
    slug: 'umi-no-hi',
    japanese: '海の日',
    reading: 'うみのひ',
    spanish: 'Día del Mar',
    holiday: true,
    dates: nthMonday(7, 3),
  },
  {
    slug: 'yama-no-hi',
    japanese: '山の日',
    reading: 'やまのひ',
    spanish: 'Día de la Montaña',
    holiday: true,
    dates: on(8, 11),
  },
  {
    slug: 'obon',
    japanese: 'お盆',
    reading: 'おぼん',
    spanish: 'Fiesta de los antepasados',
    holiday: false,
    themed: true,
    dates: between({ month: 8, day: 13 }, { month: 8, day: 16 }),
  },
  {
    slug: 'keiro-no-hi',
    japanese: '敬老の日',
    reading: 'けいろうのひ',
    spanish: 'Día del Respeto a los Mayores',
    holiday: true,
    dates: nthMonday(9, 3),
  },
  {
    slug: 'shubun-no-hi',
    japanese: '秋分の日',
    reading: 'しゅうぶんのひ',
    spanish: 'Equinoccio de otoño',
    holiday: true,
    dates: (year) => ({ start: { month: 9, day: equinoxDay(year, 'autumn') } }),
  },
  {
    slug: 'supotsu-no-hi',
    japanese: 'スポーツの日',
    reading: 'スポーツのひ',
    spanish: 'Día del Deporte',
    holiday: true,
    dates: nthMonday(10, 2),
  },
  {
    slug: 'bunka-no-hi',
    japanese: '文化の日',
    reading: 'ぶんかのひ',
    spanish: 'Día de la Cultura',
    holiday: true,
    dates: on(11, 3),
  },
  {
    slug: 'shichigosan',
    japanese: '七五三',
    reading: 'しちごさん',
    spanish: 'Fiesta de los niños de siete, cinco y tres años',
    holiday: false,
    themed: true,
    dates: on(11, 15),
  },
  {
    slug: 'kinro-kansha-no-hi',
    japanese: '勤労感謝の日',
    reading: 'きんろうかんしゃのひ',
    spanish: 'Día de Acción de Gracias por el Trabajo',
    holiday: true,
    dates: on(11, 23),
  },
  {
    slug: 'kurisumasu',
    japanese: 'クリスマス',
    reading: 'クリスマス',
    spanish: 'Navidad',
    holiday: false,
    themed: true,
    dates: between({ month: 12, day: 24 }, { month: 12, day: 25 }),
  },
  {
    slug: 'omisoka',
    japanese: '大晦日',
    reading: 'おおみそか',
    spanish: 'Último día del año',
    holiday: false,
    themed: true,
    dates: on(12, 31),
  },
];

/** Las fechas culturales que caen en `date`, en el orden de `CULTURAL_DAYS`. */
export function culturalDaysOn(date: CalendarDate): CulturalDay[] {
  const target = monthDay(date.month, date.day);
  return CULTURAL_DAYS.filter((entry) => {
    const { start, end = start } = entry.dates(date.year);
    return monthDay(start.month, start.day) <= target && target <= monthDay(end.month, end.day);
  });
}

export interface CulturalDayInMonth {
  readonly entry: CulturalDay;
  readonly startDay: number;
  /** Último día dentro del mes; igual a `startDay` si dura un día. */
  readonly endDay: number;
}

/** Las fechas culturales que tocan el mes, con los días que ocupan en él (お花見 empieza en marzo y sigue en abril). */
export function culturalDaysInMonth(year: number, month: number, lastDay: number): CulturalDayInMonth[] {
  const monthStart = monthDay(month, 1);
  const monthEnd = monthDay(month, lastDay);
  return CULTURAL_DAYS.flatMap((entry) => {
    const { start, end = start } = entry.dates(year);
    const from = Math.max(monthDay(start.month, start.day), monthStart);
    const to = Math.min(monthDay(end.month, end.day), monthEnd);
    return from <= to ? [{ entry, startDay: from % 100, endDay: to % 100 }] : [];
  });
}

/** La fecha temática de `date`, si hay una. Si se cruzan dos, gana la primera de `CULTURAL_DAYS`. */
export function themedDayOn(date: CalendarDate): CulturalDay | null {
  return culturalDaysOn(date).find((entry) => entry.themed) ?? null;
}
