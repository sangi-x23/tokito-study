import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/lib/routes';
import { KANJI_GRADES, type KanjiGradeEntry } from '../kanji-grades';

/** Los grados como pestañas, para saltar de uno a otro sin volver a la portada. */
export function KanjiGradeNav({ current }: { current: KanjiGradeEntry }): ReactNode {
  return (
    <nav aria-label="Grados">
      <ul className="flex flex-wrap gap-2">
        {KANJI_GRADES.map((entry) => {
          const active = entry.slug === current.slug;
          return (
            <li key={entry.slug}>
              <Link
                href={routes.kanjiGrade(entry.slug)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex rounded-full border px-3 py-1 text-sm transition-colors ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                }`}
              >
                {entry.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
