import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { routes } from '@/lib/routes';
import { KANJI_GRADES } from '@/modules/kanji/grades';
import { writingSection } from '../section';

/** Portada de Kanji: qué son los jōyō y un acceso por grado. */
export function KanjiHomeView(): ReactNode {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Breadcrumb crumbs={[{ label: writingSection.label, href: writingSection.href }, { label: 'Kanji' }]} />
        <h1 className="text-3xl font-semibold tracking-tight">
          Kanji{' '}
          <span lang="ja" className="text-slate-400">
            漢字
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Los 2136 kanji de uso común (<span lang="ja">常用漢字</span>, jōyō), ordenados por el grado escolar en que se
          aprenden en Japón: 1026 en primaria y el resto en secundaria. Dentro de cada grado van del más al menos usado.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {KANJI_GRADES.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={routes.kanjiGrade(entry.slug)}
              className="flex rounded-xl border border-slate-200 px-4 py-3 font-medium transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
