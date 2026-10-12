import type { KanaTable } from '@tokito/shared';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { KanaGrid } from '../components/kana-grid';
import type { WritingScript } from '../scripts';
import { writingSection } from '../section';

/** La tabla de un silabario: un grupo de kana debajo del otro. */
export function KanaTableView({ script, table }: { script: WritingScript; table: KanaTable }): ReactNode {
  const total = table.groups.reduce((count, group) => count + group.kana.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Breadcrumb crumbs={[{ label: writingSection.label, href: writingSection.href }, { label: script.label }]} />
        <h1 className="text-3xl font-semibold tracking-tight">
          {script.label}{' '}
          <span lang="ja" className="text-slate-400">
            {script.japanese}
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{total} kana</p>
        <p className="text-slate-600 dark:text-slate-400">{script.description}</p>
      </div>
      {table.groups.map((group) => (
        <KanaGrid key={group.kind} group={group} />
      ))}
    </div>
  );
}
