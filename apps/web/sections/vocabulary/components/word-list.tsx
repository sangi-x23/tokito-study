'use client';

import type { VocabularySummary } from '@tokito/shared';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { VocabularyDialog } from '@/modules/vocabulary/components/vocabulary-dialog';
import { groupByRow, matchesWord } from '../kana-rows';

function WordCards({
  words,
  onSelect,
}: {
  words: readonly VocabularySummary[];
  onSelect: (word: VocabularySummary) => void;
}): ReactNode {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {words.map((word) => (
        <li key={word.id}>
          <button
            type="button"
            onClick={() => onSelect(word)}
            aria-label={`${word.japanese} (${word.equivalents[0]}): ver significado y ejemplos`}
            className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span lang="ja" className="text-xl font-medium">
                {word.japanese}
              </span>
              {word.reading !== word.japanese && (
                <span lang="ja" className="text-sm text-slate-500 dark:text-slate-400">
                  {word.reading}
                </span>
              )}
            </span>
            <span className="w-full truncate text-sm text-slate-600 dark:text-slate-400">
              {word.equivalents.join(', ')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Las palabras de un nivel por fila del silabario, como un diccionario, con
 * un índice para saltar a cada fila y un buscador en japonés o en español
 * que, mientras tiene texto, muestra solo los resultados. Cada palabra abre
 * su modal. La búsqueda y la palabra abierta viven solo en memoria.
 */
export function WordList({ words }: { words: readonly VocabularySummary[] }): ReactNode {
  const [selected, setSelected] = useState<VocabularySummary | null>(null);
  const [query, setQuery] = useState('');
  const searchId = useId();
  const groups = useMemo(() => groupByRow(words), [words]);
  const results = useMemo(() => words.filter((word) => matchesWord(word, query)), [words, query]);
  const searching = query.trim() !== '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label htmlFor={searchId} className="sr-only">
          Buscar palabra
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en japonés o en español"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-sky-500 sm:max-w-sm dark:border-slate-800 dark:bg-slate-950"
        />
        {!searching && (
          <nav aria-label="Filas del silabario">
            <ul className="flex flex-wrap gap-1">
              {groups.map((group) => (
                <li key={group.anchor}>
                  <a
                    href={`#${group.anchor}`}
                    lang="ja"
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  >
                    {group.row.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {searching ? (
        <section aria-live="polite" className="flex flex-col gap-3">
          <h2 className="text-sm text-slate-500 dark:text-slate-400">
            {results.length === 0
              ? 'Ninguna palabra del nivel coincide con la búsqueda.'
              : `${results.length} ${results.length === 1 ? 'palabra coincide' : 'palabras coinciden'}`}
          </h2>
          <WordCards words={results} onSelect={setSelected} />
        </section>
      ) : (
        groups.map((group) => (
          // El navegador no pinta las filas fuera de pantalla hasta que se
          // acercan: N1 tiene unas 3400 palabras. `auto` recuerda la altura
          // real, y las anclas del índice siguen llevando a cada fila.
          <section
            key={group.anchor}
            id={group.anchor}
            className="flex scroll-mt-4 flex-col gap-3 [contain-intrinsic-size:auto_60rem] [content-visibility:auto]"
          >
            <h2 className="flex items-baseline gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span lang="ja" className="text-lg text-slate-900 dark:text-slate-100">
                {group.row.label}
              </span>
              <span className="tabular-nums">{group.words.length}</span>
            </h2>
            <WordCards words={group.words} onSelect={setSelected} />
          </section>
        ))
      )}

      {selected && <VocabularyDialog key={selected.id} word={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
