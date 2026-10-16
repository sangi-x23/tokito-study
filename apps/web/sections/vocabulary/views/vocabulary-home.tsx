import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { LinkPendingHint } from '@/components/layout/link-pending-hint';
import { routes } from '@/lib/routes';
import { JLPT_LEVELS } from '@/modules/vocabulary/levels';
import { vocabularySection } from '../section';

/** Portada de Vocabulario: qué son los niveles y un acceso a cada uno. */
export function VocabularyHome(): ReactNode {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Breadcrumb crumbs={[{ label: vocabularySection.label }]} />
        <h1 className="text-3xl font-semibold tracking-tight">
          Vocabulario{' '}
          <span lang="ja" className="text-slate-400">
            語彙
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Unas 8000 palabras ordenadas por los niveles del examen oficial de japonés (JLPT), de N5, el más fácil, a N1.
          Cada una trae su lectura, su traducción, qué significa y cómo se usa, y oraciones de ejemplo.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          El JLPT no publica listas de vocabulario desde 2010: estas son las de Jonathan Waller, las más usadas, armadas
          a partir de exámenes anteriores. Son una guía, no la lista oficial.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {JLPT_LEVELS.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={routes.vocabularyLevel(entry.slug)}
              className="flex h-full flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              <span className="flex items-center justify-between gap-2 font-medium">
                {entry.label}
                <LinkPendingHint />
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{entry.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
