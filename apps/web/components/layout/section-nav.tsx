import type { ReactNode } from 'react';
import { SlidingHighlight } from '@/modules/motion/components/sliding-highlight';

/**
 * La barra de navegación interna de una sección (los temas del Diario, los
 * silabarios de Escritura). En escritorio es una columna fija junto al
 * sidebar de la app; en pantallas chicas, una fila con scroll horizontal
 * sobre el contenido. El fondo del enlace activo se desliza al cambiar de
 * selección.
 *
 * `children` son los `<li>` con un `SectionNavLink` cada uno.
 */
export function SectionNav({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <aside className="border-b border-slate-200 lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 dark:border-slate-800">
      <nav aria-label={label} className="px-4 py-3 lg:px-3 lg:py-6">
        <h2 className="hidden px-3 pb-2 text-xs font-medium tracking-wide text-slate-500 uppercase lg:block dark:text-slate-400">
          {label}
        </h2>
        <SlidingHighlight
          className="overflow-x-auto lg:overflow-visible"
          highlightClassName="rounded-lg bg-slate-100 dark:bg-slate-800"
        >
          <ul className="relative flex gap-1 lg:flex-col">{children}</ul>
        </SlidingHighlight>
      </nav>
    </aside>
  );
}
