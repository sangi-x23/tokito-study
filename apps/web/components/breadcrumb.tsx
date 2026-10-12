import Link from 'next/link';
import type { ReactNode } from 'react';

export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

/** La ruta hasta la página actual. El primer crumb es la sección; el último, la página, sin enlace. */
export function Breadcrumb({ crumbs }: { crumbs: readonly Crumb[] }): ReactNode {
  return (
    <nav aria-label="Ruta" className="text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => (
          <li key={crumb.label} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden>/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-slate-900 dark:hover:text-slate-100">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-900 dark:text-slate-100">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
