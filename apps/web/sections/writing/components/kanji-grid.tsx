'use client';

import type { KanjiSummary } from '@tokito/shared';
import { useState, type ReactNode } from 'react';
import { KanjiDialog } from '@/modules/kanji/components/kanji-dialog';

/**
 * Los kanji de un grado: cada celda abre su modal, como los kana básicos. Un
 * solo modal para toda la cuadrícula, con el kanji abierto en memoria.
 */
export function KanjiGrid({ kanji }: { kanji: readonly KanjiSummary[] }): ReactNode {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
        {kanji.map((entry) => (
          <li key={entry.character}>
            <button
              type="button"
              onClick={() => setSelected(entry.character)}
              aria-label={`${entry.character} (${entry.meaning}): ver lecturas y orden de trazos`}
              className="flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-xl border border-slate-200 px-1 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              <span lang="ja" className="text-3xl font-medium">
                {entry.character}
              </span>
              <span className="w-full truncate text-center text-xs text-slate-500 dark:text-slate-400">
                {entry.meaning}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selected && <KanjiDialog key={selected} character={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
