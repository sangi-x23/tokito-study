import type { ReactNode } from 'react';
import { SectionNav } from '@/components/layout/section-nav';
import { SectionNavLink } from '@/components/layout/section-nav-link';
import { routes } from '@/lib/routes';
import { CALENDAR_MONTHS } from '@/modules/calendar/japanese-dates';

/** Los doce meses, con su nombre en japonés. */
export function MonthNav(): ReactNode {
  return (
    <SectionNav label="Meses">
      {CALENDAR_MONTHS.map((entry) => (
        <li key={entry.slug} className="shrink-0">
          <SectionNavLink href={routes.calendarMonth(entry.slug)}>
            <span lang="ja">{entry.japanese}</span> <span className="text-ink-subtle">{entry.spanish}</span>
          </SectionNavLink>
        </li>
      ))}
    </SectionNav>
  );
}
