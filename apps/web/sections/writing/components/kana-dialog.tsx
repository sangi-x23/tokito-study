'use client';

import type { Kana } from '@tokito/shared';
import type { ReactNode } from 'react';
import { Modal } from '@/components/modal';
import { StrokeOrder } from '@/modules/writing/components/stroke-order';
import type { KanaRef, KanaRelations } from '@/modules/writing/kana-relations';

function RelatedList({ title, items }: { title: ReactNode; items: readonly KanaRef[] }): ReactNode {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item.character}
            className="flex min-w-14 flex-col items-center rounded-lg border border-slate-200 px-2 py-1.5 dark:border-slate-800"
          >
            <span lang="ja" className="text-xl">
              {item.character}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.romaji}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** El modal de un kana básico: su orden de trazos y los kana que salen de él. */
export function KanaDialog({
  kana,
  relations,
  onClose,
}: {
  kana: Kana;
  relations: KanaRelations | undefined;
  onClose: () => void;
}): ReactNode {
  return (
    <Modal
      onClose={onClose}
      title={
        <>
          <span lang="ja" className="text-5xl font-medium">
            {kana.character}
          </span>
          <span className="text-lg text-slate-500 dark:text-slate-400">{kana.romaji}</span>
        </>
      }
    >
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Orden de trazos</h3>
        <StrokeOrder strokes={kana.strokes} />
      </section>

      {relations && (
        <>
          <RelatedList
            title={
              <>
                Con tenten <span lang="ja">゛</span>
              </>
            }
            items={relations.tenten}
          />
          <RelatedList
            title={
              <>
                Con maru <span lang="ja">゜</span>
              </>
            }
            items={relations.maru}
          />
          <RelatedList title="Combinaciones" items={relations.combinations} />
          <RelatedList title="Extendidos" items={relations.extended} />
        </>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Trazos de{' '}
        <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer" className="underline">
          KanjiVG
        </a>{' '}
        (CC BY-SA 3.0).
      </p>
    </Modal>
  );
}
