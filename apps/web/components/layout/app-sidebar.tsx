import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/lib/routes';
import type { CalendarDate } from '@/modules/calendar/calendar-dates';
import { culturalDaysOn } from '@/modules/calendar/cultural-days';
import { findMonth } from '@/modules/calendar/japanese-dates';
import { SlidingHighlight } from '@/modules/motion/components/sliding-highlight';
import { APP_SECTIONS } from '@/sections';
import { LinkPendingHint } from './link-pending-hint';
import { SidebarFrame } from './sidebar-frame';
import { SidebarLink } from './sidebar-link';

function Brand(): ReactNode {
  return (
    <Link href="/" className="text-lg font-semibold tracking-tight">
      Tokito{' '}
      <span lang="ja" className="text-ink-faint">
        ときと
      </span>
    </Link>
  );
}

/** Si hoy es una fecha cultural, su nombre y un enlace a su mes: explica por qué cambió el tema. */
function TodayNote({ today }: { today: CalendarDate }): ReactNode {
  const events = culturalDaysOn(today);
  if (events.length === 0) {
    return null;
  }
  return (
    <Link
      href={routes.calendarMonth(findMonth(today.month).slug)}
      className="mx-3 flex flex-col rounded-lg border border-line px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
    >
      <span className="flex items-center justify-between gap-2 text-xs text-ink-subtle">
        Hoy en Japón
        <LinkPendingHint className="size-3.5" />
      </span>
      {events.map((entry) => (
        <span key={entry.slug}>
          <span lang="ja" className="font-medium">
            {entry.japanese}
          </span>{' '}
          <span className="text-ink-muted">{entry.spanish}</span>
        </span>
      ))}
    </Link>
  );
}

/** La navegación principal de la app: una entrada por sección. */
export function AppSidebar({ today }: { today: CalendarDate }): ReactNode {
  return (
    <SidebarFrame brand={<Brand />}>
      <div className="px-5 py-4">
        <Brand />
      </div>
      <nav aria-label="Secciones" className="flex-1 overflow-y-auto px-3 py-2">
        <SlidingHighlight highlightClassName="rounded-lg bg-surface-strong">
          <ul className="relative flex flex-col gap-1">
            {APP_SECTIONS.map((section) => (
              <li key={section.href}>
                <SidebarLink href={section.href}>
                  <section.Icon className="size-5 shrink-0" />
                  {section.label}
                </SidebarLink>
              </li>
            ))}
          </ul>
        </SlidingHighlight>
      </nav>
      <TodayNote today={today} />
      <p className="px-5 py-4 text-xs text-ink-faint">Material de estudio de japonés</p>
    </SidebarFrame>
  );
}
