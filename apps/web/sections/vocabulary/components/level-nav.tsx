import type { ReactNode } from 'react';
import { SectionNav } from '@/components/layout/section-nav';
import { SectionNavLink } from '@/components/layout/section-nav-link';
import { routes } from '@/lib/routes';
import { JLPT_LEVELS } from '@/modules/vocabulary/levels';

/** Los niveles del JLPT, del más fácil al más difícil. */
export function LevelNav(): ReactNode {
  return (
    <SectionNav label="Niveles">
      {JLPT_LEVELS.map((entry) => (
        <li key={entry.slug} className="shrink-0">
          <SectionNavLink href={routes.vocabularyLevel(entry.slug)}>{entry.label}</SectionNavLink>
        </li>
      ))}
    </SectionNav>
  );
}
