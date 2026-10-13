import type { KanjiSummary } from '@tokito/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/lib/routes';

/** Los kanji de un grado: cada celda lleva a la página del kanji. */
export function KanjiGrid({ kanji }: { kanji: readonly KanjiSummary[] }): ReactNode {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
      {kanji.map((entry) => (
        <li key={entry.character}>
          <Link
            href={routes.kanjiDetail(entry.character)}
            className="flex w-full flex-col items-center gap-0.5 rounded-xl border border-slate-200 px-1 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <span lang="ja" className="text-3xl font-medium">
              {entry.character}
            </span>
            <span className="w-full truncate text-center text-xs text-slate-500 dark:text-slate-400">
              {entry.meaning}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
