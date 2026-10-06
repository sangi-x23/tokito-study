'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * El marco del sidebar: fijo a la izquierda en escritorio y, en pantallas
 * chicas, un panel que se abre con el botón de la barra superior.
 *
 * El panel recuerda en qué ruta se abrió y solo se muestra mientras se siga
 * en ella, así que navegar a otra página lo cierra sin efectos extra.
 */
export function SidebarFrame({ brand, children }: { brand: ReactNode; children: ReactNode }): ReactNode {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpenAt(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/90">
        <button
          type="button"
          onClick={() => setOpenAt(pathname)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="app-sidebar"
          className="-ml-1 rounded-md p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden className="size-6">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {brand}
      </div>

      {open && (
        <div aria-hidden className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpenAt(null)} />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:shrink-0 lg:translate-x-0 dark:border-slate-800 dark:bg-slate-950 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </aside>
    </>
  );
}
