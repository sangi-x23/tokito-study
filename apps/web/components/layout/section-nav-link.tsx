'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Un enlace de `SectionNav`. Es de cliente solo para saber la ruta actual:
 * queda activo en su página y en las que llegan en `activeOn` (en el Diario,
 * las de los subtemas del tema).
 *
 * Su fondo activo solo se ve hasta que hidrata: después lo pinta el fondo
 * deslizante de `SlidingHighlight`, que marca la lista con `data-highlight`.
 */
export function SectionNavLink({
  href,
  activeOn = [],
  children,
}: {
  href: string;
  activeOn?: readonly string[];
  children: ReactNode;
}): ReactNode {
  const pathname = usePathname();
  const active = pathname === href || activeOn.includes(pathname);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`block rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors lg:whitespace-normal ${
        active
          ? 'bg-slate-100 font-medium text-slate-900 in-data-highlight:bg-transparent! dark:bg-slate-800 dark:text-slate-100'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}
