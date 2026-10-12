import type { Kana, KanaKind } from '@tokito/shared';
import type { ReactNode } from 'react';
import { KANA_KIND_DESCRIPTION, KANA_KIND_LABEL } from '@/modules/writing/labels';
import { CELL_CLASS, cellStyle, gridProps } from './kana-grid-layout';

/** Un grupo de kana: su título, su descripción y la cuadrícula que llega en `children`. */
export function KanaGroupSection({ kind, children }: { kind: KanaKind; children: ReactNode }): ReactNode {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{KANA_KIND_LABEL[kind]}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{KANA_KIND_DESCRIPTION[kind]}</p>
      </div>
      {children}
    </section>
  );
}

/** La cuadrícula de un grupo, sin interacción. */
export function KanaGrid({ kana }: { kana: readonly Kana[] }): ReactNode {
  return (
    <ul {...gridProps(kana)}>
      {kana.map((entry) => (
        <li key={entry.character} style={cellStyle(entry)} className={CELL_CLASS}>
          <span lang="ja" className="text-2xl font-medium sm:text-3xl">
            {entry.character}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{entry.romaji}</span>
        </li>
      ))}
    </ul>
  );
}
