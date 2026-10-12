'use client';

import type { Kana } from '@tokito/shared';
import { useState, type ReactNode } from 'react';
import type { KanaRelations } from '@/modules/writing/kana-relations';
import { KanaDialog } from './kana-dialog';
import { CELL_CLASS, cellStyle, gridProps } from './kana-grid-layout';

/**
 * La cuadrícula de los básicos: cada kana es una tarjeta que abre su modal.
 * El kana abierto vive solo en memoria.
 */
export function BasicKanaGrid({
  kana,
  relations,
}: {
  kana: readonly Kana[];
  relations: Readonly<Record<string, KanaRelations>>;
}): ReactNode {
  const [selected, setSelected] = useState<Kana | null>(null);

  return (
    <>
      <ul {...gridProps(kana)}>
        {kana.map((entry) => (
          <li key={entry.character} style={cellStyle(entry)}>
            <button
              type="button"
              onClick={() => setSelected(entry)}
              aria-label={`${entry.character} (${entry.romaji}): ver orden de trazos y combinaciones`}
              className={`${CELL_CLASS} cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500 dark:hover:bg-slate-900`}
            >
              <span lang="ja" className="text-2xl font-medium sm:text-3xl">
                {entry.character}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{entry.romaji}</span>
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <KanaDialog kana={selected} relations={relations[selected.character]} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
