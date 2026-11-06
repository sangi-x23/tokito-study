import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { type CalendarDate, daysInMonth } from '@/modules/calendar/calendar-dates';
import { culturalDaysInMonth } from '@/modules/calendar/cultural-days';
import type { CalendarMonth } from '@/modules/calendar/japanese-dates';
import { MonthEvents } from '../components/month-events';
import { MonthGrid } from '../components/month-grid';
import { ReadingsToggle } from '../components/readings-toggle';
import { READING_CLASS } from '../readings';
import { calendarSection } from '../section';

/** Un mes del año en curso: su cuadrícula y sus fechas culturales. */
export function MonthView({ month, today }: { month: CalendarMonth; today: CalendarDate }): ReactNode {
  const { year } = today;
  const events = culturalDaysInMonth(year, month.month, daysInMonth(year, month.month));

  return (
    <ReadingsToggle
      header={
        <div className="flex flex-col gap-2">
          <Breadcrumb
            crumbs={[{ label: calendarSection.label, href: calendarSection.href }, { label: month.spanish }]}
          />
          <h1 className="flex flex-wrap items-baseline gap-x-3 text-3xl font-semibold tracking-tight">
            <ruby lang="ja">
              {month.japanese}
              <rt className={`text-sm font-normal text-ink-subtle ${READING_CLASS}`}>{month.reading}</rt>
            </ruby>
            <span className="text-xl font-normal text-ink-muted">
              {month.spanish} de {year}
            </span>
          </h1>
          <p className="text-sm text-ink-subtle">
            Domingos y feriados en rojo, sábados en azul, como en los calendarios japoneses. Las lecturas resaltadas son
            irregulares: hay que memorizarlas.
          </p>
        </div>
      }
    >
      <MonthGrid year={year} month={month.month} today={today} />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Fechas del mes</h2>
        <MonthEvents year={year} month={month.month} events={events} />
      </section>
    </ReadingsToggle>
  );
}
