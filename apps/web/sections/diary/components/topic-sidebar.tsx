import type { TopicNode } from '@tokito/shared';
import type { ReactNode } from 'react';
import { SectionNav } from '@/components/layout/section-nav';
import { SectionNavLink } from '@/components/layout/section-nav-link';
import { routes } from '@/lib/routes';

/** Los temas de primer nivel del Diario. */
export function TopicSidebar({ tree }: { tree: readonly TopicNode[] }): ReactNode {
  return (
    <SectionNav label="Temas">
      {tree.map((topic) => (
        <li key={topic.slug} className="shrink-0">
          <SectionNavLink
            href={routes.topic(topic.slug)}
            activeOn={topic.children.map((child) => routes.topic(child.slug))}
          >
            {topic.name}
          </SectionNavLink>
        </li>
      ))}
    </SectionNav>
  );
}
