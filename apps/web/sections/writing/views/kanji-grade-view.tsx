import type { KanjiGradeTable } from '@tokito/shared';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { routes } from '@/lib/routes';
import { KanjiGradeNav } from '../components/kanji-grade-nav';
import { KanjiGrid } from '../components/kanji-grid';
import type { KanjiGradeEntry } from '../kanji-grades';
import { writingSection } from '../section';

/** Los kanji de un grado, del más al menos usado. */
export function KanjiGradeView({ grade, table }: { grade: KanjiGradeEntry; table: KanjiGradeTable }): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Breadcrumb
          crumbs={[
            { label: writingSection.label, href: writingSection.href },
            { label: 'Kanji', href: routes.kanji },
            { label: grade.label },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">Kanji de {grade.label.toLowerCase()}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{table.kanji.length} kanji, del más al menos usado</p>
      </div>
      <KanjiGradeNav current={grade} />
      <KanjiGrid kanji={table.kanji} />
    </div>
  );
}
