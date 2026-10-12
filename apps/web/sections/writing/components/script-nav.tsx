import type { ReactNode } from 'react';
import { SectionNav } from '@/components/layout/section-nav';
import { SectionNavLink } from '@/components/layout/section-nav-link';
import { routes } from '@/lib/routes';
import { WRITING_SCRIPTS } from '../scripts';

/** Los silabarios de Escritura. */
export function ScriptNav(): ReactNode {
  return (
    <SectionNav label="Silabarios">
      {WRITING_SCRIPTS.map((script) => (
        <li key={script.slug} className="shrink-0">
          <SectionNavLink href={routes.kanaTable(script.slug)}>{script.label}</SectionNavLink>
        </li>
      ))}
    </SectionNav>
  );
}
