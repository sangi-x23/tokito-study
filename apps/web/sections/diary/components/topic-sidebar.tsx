import type { TopicNode } from '@tokito/shared';
import type { ReactNode } from 'react';
import { routes } from '@/lib/routes';
import { SlidingHighlight } from '@/modules/motion/components/sliding-highlight';
import { TopicLink } from './topic-link';

/**
 * Los temas de primer nivel del Diario. En escritorio es una columna fija
 * junto al sidebar de la app; en pantallas chicas, una fila con scroll
 * horizontal sobre el contenido. El fondo del tema activo se desliza al
 * cambiar de selección.
 */
export function TopicSidebar({ tree }: { tree: readonly TopicNode[] }): ReactNode {
  return (
    <aside className="border-b border-slate-200 lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 dark:border-slate-800">
      <nav aria-label="Temas" className="px-4 py-3 lg:px-3 lg:py-6">
        <h2 className="hidden px-3 pb-2 text-xs font-medium tracking-wide text-slate-500 uppercase lg:block dark:text-slate-400">
          Temas
        </h2>
        <SlidingHighlight
          className="overflow-x-auto lg:overflow-visible"
          highlightClassName="rounded-lg bg-slate-100 dark:bg-slate-800"
        >
          <ul className="relative flex gap-1 lg:flex-col">
            {tree.map((topic) => (
              <li key={topic.slug} className="shrink-0">
                <TopicLink
                  href={routes.topic(topic.slug)}
                  activeOn={topic.children.map((child) => routes.topic(child.slug))}
                >
                  {topic.name}
                </TopicLink>
              </li>
            ))}
          </ul>
        </SlidingHighlight>
      </nav>
    </aside>
  );
}
