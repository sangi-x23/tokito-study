import { routes } from '@/lib/routes';
import type { AppSection } from '../types';
import { CalendarIcon } from './icon';

export const calendarSection: AppSection = {
  label: 'Calendario',
  href: routes.calendar,
  Icon: CalendarIcon,
};
