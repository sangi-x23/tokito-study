'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Enlace a una sección del sidebar. Es de cliente solo para saber la ruta
 * actual: una sección queda activa en su página y en todas las que cuelgan
 * de ella (`/diario/temas/…` sigue dentro de «Diario de clase»).
 */
export function SidebarLink({ href, children }: { href: string; children: ReactNode }): ReactNode {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}
