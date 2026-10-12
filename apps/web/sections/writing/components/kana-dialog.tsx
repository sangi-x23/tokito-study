'use client';

import type { Kana } from '@tokito/shared';
import { useEffect, useRef, type ReactNode } from 'react';
import { StrokeOrder } from '@/modules/writing/components/stroke-order';
import type { KanaRef, KanaRelations } from '@/modules/writing/kana-relations';

function RelatedList({ title, items }: { title: ReactNode; items: readonly KanaRef[] }): ReactNode {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item.character}
            className="flex min-w-14 flex-col items-center rounded-lg border border-slate-200 px-2 py-1.5 dark:border-slate-800"
          >
            <span lang="ja" className="text-xl">
              {item.character}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.romaji}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * El modal de un kana básico: su orden de trazos y los kana que salen de él.
 * Es un `<dialog>` nativo abierto con `showModal()`, que ya cierra con Esc y
 * retiene el foco; un clic fuera del cuadro también lo cierra.
 */
export function KanaDialog({
  kana,
  relations,
  onClose,
}: {
  kana: Kana;
  relations: KanaRelations | undefined;
  onClose: () => void;
}): ReactNode {
  const dialog = useRef<HTMLDialogElement>(null);

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
      aria-labelledby="kana-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        // El clic en el fondo llega al propio <dialog>; dentro del cuadro, a sus hijos.
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="kana-dialog-title" className="flex items-baseline gap-3">
            <span lang="ja" className="text-5xl font-medium">
              {kana.character}
            </span>
            <span className="text-lg text-slate-500 dark:text-slate-400">{kana.romaji}</span>
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

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Orden de trazos</h3>
          <StrokeOrder strokes={kana.strokes} />
        </section>

        {relations && (
          <>
            <RelatedList
              title={
                <>
                  Con tenten <span lang="ja">゛</span>
                </>
              }
              items={relations.tenten}
            />
            <RelatedList
              title={
                <>
                  Con maru <span lang="ja">゜</span>
                </>
              }
              items={relations.maru}
            />
            <RelatedList title="Combinaciones" items={relations.combinations} />
            <RelatedList title="Extendidos" items={relations.extended} />
          </>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Trazos de{' '}
          <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer" className="underline">
            KanjiVG
          </a>{' '}
          (CC BY-SA 3.0).
        </p>
      </div>
    </dialog>
  );
}
