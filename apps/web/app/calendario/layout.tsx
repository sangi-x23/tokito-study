import type { ReactNode } from 'react';
import { CalendarLayout } from '@/sections/calendar/views/calendar-layout';

export default function Layout({ children }: { children: ReactNode }): ReactNode {
  return <CalendarLayout>{children}</CalendarLayout>;
}
