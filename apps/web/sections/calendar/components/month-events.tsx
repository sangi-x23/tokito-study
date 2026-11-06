import type { ReactNode } from 'react';
import { weekdayOf } from '@/modules/calendar/calendar-dates';
import type { CulturalDayInMonth } from '@/modules/calendar/cultural-days';
import { WEEKDAYS } from '@/modules/calendar/japanese-dates';
import { ThemePreviewButton } from '@/modules/theme/components/theme-preview';
import { READING_CLASS } from '../readings';

/** `13日（木）`: la fecha como se escribe en japonés, para seguir practicando. */
function japaneseDay(year: number, month: number, day: number): string {
  return `${day}日（${WEEKDAYS[weekdayOf({ year, month, day })]!.short}）`;
}

/** Las fechas culturales del mes, en orden. */
export function MonthEvents({
  year,
  month,
  events,
}: {
  year: number;
  month: number;
  events: readonly CulturalDayInMonth[];
}): ReactNode {
  if (events.length === 0) {
    return <p className="text-sm text-ink-subtle">Este mes no tiene feriados ni celebraciones de la lista.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map(({ entry, startDay, endDay }) => (
        <li
          key={entry.slug}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-line px-4 py-3"
        >
          <span lang="ja" className="w-36 shrink-0 text-sm text-ink-subtle">
            {japaneseDay(year, month, startDay)}
            {endDay !== startDay && `〜${japaneseDay(year, month, endDay)}`}
          </span>
          <span className="flex flex-col">
            <ruby lang="ja" className="text-lg font-medium">
              {entry.japanese}
              <rt className={`text-xs font-normal text-ink-subtle ${READING_CLASS}`}>{entry.reading}</rt>
            </ruby>
            <span className="text-sm text-ink-muted">{entry.spanish}</span>
          </span>
          <span className="ml-auto flex items-center gap-2">
            {entry.holiday && (
              <span className="rounded-md bg-surface-strong px-2 py-0.5 text-xs text-holiday">Feriado nacional</span>
            )}
            {entry.themed && (
              // Solo los datos planos: `entry.dates` es una función y no cruza al cliente.
              <ThemePreviewButton theme={{ slug: entry.slug, japanese: entry.japanese, spanish: entry.spanish }} />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
