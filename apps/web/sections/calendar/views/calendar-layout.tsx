import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { MonthNav } from '../components/month-nav';

/** El marco de todas las páginas del Calendario: la barra de meses y el contenido. */
export function CalendarLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="lg:flex">
      <MonthNav />
      <div className="min-w-0 flex-1">
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
