'use client';

import type { KanjiSummary } from '@tokito/shared';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { KanjiDialog } from '@/modules/kanji/components/kanji-dialog';
import { kanjiBlocks, matchesKanji } from '../kanji-blocks';

function KanjiCells({
  kanji,
  onSelect,
}: {
  kanji: readonly KanjiSummary[];
  onSelect: (character: string) => void;
}): ReactNode {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
      {kanji.map((entry) => (
        <li key={entry.character}>
          <button
            type="button"
            onClick={() => onSelect(entry.character)}
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
  );
}

/**
 * Los kanji de un grado en bloques de 50, del más al menos usado, con un
 * buscador por carácter o significado que, mientras tiene texto, muestra solo
 * los resultados. Cada celda abre su modal, como los kana
 * básicos. La búsqueda y el kanji abierto viven solo en memoria.
 */
export function KanjiGrid({ kanji }: { kanji: readonly KanjiSummary[] }): ReactNode {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const searchId = useId();
  const blocks = useMemo(() => kanjiBlocks(kanji), [kanji]);
  const results = useMemo(() => kanji.filter((entry) => matchesKanji(entry, query)), [kanji, query]);
  const searching = query.trim() !== '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor={searchId} className="sr-only">
          Buscar kanji
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por kanji o significado"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-sky-500 sm:max-w-sm dark:border-slate-800 dark:bg-slate-950"
        />
      </div>

      {searching ? (
        <section aria-live="polite" className="flex flex-col gap-3">
          <h2 className="text-sm text-slate-500 dark:text-slate-400">
            {results.length === 0
              ? 'Ningún kanji del grado coincide con la búsqueda.'
              : `${results.length} ${results.length === 1 ? 'kanji coincide' : 'kanji coinciden'}`}
          </h2>
          <KanjiCells kanji={results} onSelect={setSelected} />
        </section>
      ) : (
        blocks.map((block) => (
          // El navegador no pinta los bloques fuera de pantalla hasta que se
          // acercan: secundaria tiene 23. `auto` recuerda la altura real.
          <section
            key={block.start}
            className="flex flex-col gap-3 [contain-intrinsic-size:auto_40rem] [content-visibility:auto]"
          >
            <h2 className="text-sm font-medium tracking-wide text-slate-500 uppercase tabular-nums dark:text-slate-400">
              {block.start}–{block.end}
            </h2>
            <KanjiCells kanji={block.kanji} onSelect={setSelected} />
          </section>
        ))
      )}

      {selected && <KanjiDialog key={selected} character={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
