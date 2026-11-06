import type { KanaTable } from '@tokito/shared';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { kanaRelations } from '@/modules/writing/kana-relations';
import { BasicKanaGrid } from '../components/basic-kana-grid';
import { KanaGrid, KanaGroupSection } from '../components/kana-grid';
import type { WritingScript } from '../scripts';
import { writingSection } from '../section';

/**
 * La tabla de un silabario: un grupo de kana debajo del otro. Los básicos son
 * tarjetas que abren su modal; las relaciones se calculan aquí, en el
 * servidor, para que al navegador solo lleguen los básicos y no la tabla entera.
 */
export function KanaTableView({ script, table }: { script: WritingScript; table: KanaTable }): ReactNode {
  const total = table.groups.reduce((count, group) => count + group.kana.length, 0);
  const relations = kanaRelations(table);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Breadcrumb crumbs={[{ label: writingSection.label, href: writingSection.href }, { label: script.label }]} />
        <h1 className="text-3xl font-semibold tracking-tight">
          {script.label}{''}
          <span lang="ja" className="text-ink-faint">
            {script.japanese}
          </span>
        </h1>
        <p className="text-sm text-ink-subtle">{total} kana</p>
        <p className="text-ink-muted">{script.description}</p>
      </div>
      {table.groups.map((group) => (
        <KanaGroupSection key={group.kind} kind={group.kind}>
          {group.kind === 'BASIC' ? (
            <BasicKanaGrid kana={group.kana} relations={relations} />
          ) : (
            <KanaGrid kana={group.kana} />
          )}
        </KanaGroupSection>
      ))}
    </div>
  );
}
