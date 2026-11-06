import type { ReactNode } from 'react';
import { type CalendarDate, daysInMonth, sameDate, weekdayOf } from '@/modules/calendar/calendar-dates';
import { type CulturalDay, culturalDaysOn } from '@/modules/calendar/cultural-days';
import { dayOfMonth, WEEKDAYS } from '@/modules/calendar/japanese-dates';
import { READING_CLASS } from '../readings';

/**
 * Color del número del día, como en un calendario japonés: domingos y
 * feriados en rojo, sábados en azul.
 */
function dayColor(weekday: number, holiday: boolean): string {
  if (weekday === 0 || holiday) {
    return 'text-holiday';
  }
  return weekday === 6 ? 'text-saturday' : 'text-ink';
}

function weekdayColor(weekday: number): string {
  if (weekday === 0) {
    return 'text-holiday';
  }
  return weekday === 6 ? 'text-saturday' : 'text-ink-soft';
}

function DayCell({ date, isToday }: { date: CalendarDate; isToday: boolean }): ReactNode {
  const { japanese, reading, irregular } = dayOfMonth(date.day);
  const weekday = weekdayOf(date);
  const events: CulturalDay[] = culturalDaysOn(date);
  const holiday = events.some((entry) => entry.holiday);

  return (
    <li
      aria-current={isToday ? 'date' : undefined}
      className={`flex min-h-20 min-w-0 flex-col gap-0.5 rounded-lg border p-1 sm:min-h-24 sm:p-2 ${
        isToday ? 'border-accent ring-1 ring-accent' : 'border-line'
      }`}
    >
      <span lang="ja" className={`text-sm font-medium sm:text-base ${dayColor(weekday, holiday)}`}>
        {japanese}
        <span className="sr-only"> {WEEKDAYS[weekday]!.spanish}</span>
      </span>
      <span
        lang="ja"
        className={`text-[0.625rem] leading-tight break-all sm:text-xs ${
          irregular ? 'font-medium text-accent-ink' : 'text-ink-subtle'
        } ${READING_CLASS}`}
      >
        {reading}
      </span>
      {events.length > 0 && (
        <ul className="mt-auto flex flex-col gap-0.5">
          {events.map((entry) => (
            <li
              key={entry.slug}
              lang="ja"
              title={entry.spanish}
              className="truncate rounded bg-surface-strong px-1 text-[0.625rem] text-ink-soft sm:text-xs"
            >
              {entry.japanese}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * La cuadrícula de un mes, de domingo a sábado. Cada día lleva su número
 * (`6日`) y su lectura (むいか); las lecturas irregulares van resaltadas.
 */
export function MonthGrid({ year, month, today }: { year: number; month: number; today: CalendarDate }): ReactNode {
  const lastDay = daysInMonth(year, month);
  const leadingBlanks = weekdayOf({ year, month, day: 1 });

  return (
    <div className="flex flex-col gap-1">
      <ol className="grid grid-cols-7 gap-1" aria-hidden>
        {WEEKDAYS.map((weekday, index) => (
          <li key={weekday.japanese} lang="ja" title={weekday.spanish} className="flex flex-col items-center py-1">
            <span className={`text-sm font-medium ${weekdayColor(index)}`}>
              <span className="sm:hidden">{weekday.short}</span>
              <span className="hidden sm:inline">{weekday.japanese}</span>
            </span>
            <span className={`hidden text-xs text-ink-subtle md:block ${READING_CLASS}`}>{weekday.reading}</span>
          </li>
        ))}
      </ol>
      <ol className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <li key={`blank-${index}`} aria-hidden />
        ))}
        {Array.from({ length: lastDay }, (_, index) => {
          const date = { year, month, day: index + 1 };
          return <DayCell key={date.day} date={date} isToday={sameDate(date, today)} />;
        })}
      </ol>
    </div>
  );
}
