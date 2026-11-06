import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';
import { today } from '@/modules/calendar/calendar-dates';
import { findMonth } from '@/modules/calendar/japanese-dates';

// El mes de hoy cambia con la fecha: no se puede fijar en el build.
export const dynamic = 'force-dynamic';

/** La portada del Calendario es el mes actual, en la hora de Colombia. */
export default function CalendarPage(): never {
  redirect(routes.calendarMonth(findMonth(today().month).slug));
}
