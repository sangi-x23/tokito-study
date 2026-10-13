'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Un `<dialog>` nativo abierto con `showModal()`, que ya cierra con Esc y
 * retiene el foco; un clic fuera del cuadro también lo cierra. Todo cierre
 * pasa por el evento `close`, así que `onClose` se llama una sola vez.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}): ReactNode {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Sin limpieza: al desmontarse, el <dialog> sale del DOM y deja de ser
  // modal. Cerrarlo ahí dispararía `close` (asíncrono) y, con el doble montaje
  // de Strict Mode, el modal se cerraría apenas abierto.
  useEffect(() => {
    if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // El clic en el fondo llega al propio <dialog>; dentro del cuadro, a sus hijos.
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      className="m-auto max-h-none w-[min(32rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
    >
      {/* El scroll va aquí y no en el <dialog>, para que la barra quede dentro de las esquinas redondeadas. */}
      <div className="flex max-h-[calc(100dvh-2rem-2px)] flex-col gap-6 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="flex items-baseline gap-3">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Cerrar"
            className="-mr-2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden className="size-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
