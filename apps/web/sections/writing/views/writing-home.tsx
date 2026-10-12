import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/lib/routes';
import { WRITING_SCRIPTS } from '../scripts';

/** Portada de Escritura: los silabarios para elegir. */
export function WritingHome(): ReactNode {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Escritura</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Los dos silabarios del japonés, con todas sus combinaciones. Elige uno para ver su tabla.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {WRITING_SCRIPTS.map((script) => (
          <li key={script.slug}>
            <Link
              href={routes.kanaTable(script.slug)}
              className="flex h-full flex-col gap-1 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              <span className="font-medium">
                {script.label}{' '}
                <span lang="ja" className="text-slate-500 dark:text-slate-400">
                  {script.japanese}
                </span>
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{script.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
