import type { KanaGroup } from '@tokito/shared';
import type { ReactNode } from 'react';
import { KANA_KIND_DESCRIPTION, KANA_KIND_LABEL } from '@/modules/writing/labels';

/**
 * Un grupo de kana como cuadrícula: cada uno va en su fila y columna, y las
 * celdas sin kana quedan vacías (や no tiene yi ni ye).
 */
export function KanaGrid({ group }: { group: KanaGroup }): ReactNode {
  const columns = Math.max(...group.kana.map((kana) => kana.column)) + 1;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{KANA_KIND_LABEL[group.kind]}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{KANA_KIND_DESCRIPTION[group.kind]}</p>
      </div>
      <ul
        className={`grid gap-2 ${columns > 3 ? 'max-w-xl' : 'max-w-sm'}`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {group.kana.map((kana) => (
          <li
            key={kana.character}
            style={{ gridRowStart: kana.row + 1, gridColumnStart: kana.column + 1 }}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-200 py-3 dark:border-slate-800"
          >
            <span lang="ja" className="text-2xl font-medium sm:text-3xl">
              {kana.character}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{kana.romaji}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
