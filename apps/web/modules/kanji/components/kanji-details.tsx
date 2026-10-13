import type { KanjiDetail } from '@tokito/shared';
import type { ReactNode } from 'react';
import { StrokeOrder } from '@/modules/writing/components/stroke-order';
import { findGrade } from '../grades';
import { KanjiCredits } from './kanji-credits';
import { KanjiReadings } from './kanji-readings';

function Panel({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

/** El cuerpo del modal de un kanji: significados, lecturas, orden de trazos y créditos. */
export function KanjiDetails({ kanji }: { kanji: KanjiDetail }): ReactNode {
  const facts = [
    `${kanji.strokes.length} trazos`,
    findGrade(kanji.grade).label,
    kanji.frequency ? `n.º ${kanji.frequency} en frecuencia de uso` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-lg">{kanji.meanings.join(', ')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{facts.join(' · ')}</p>
      </div>

      <Panel title="Lecturas">
        <KanjiReadings onyomi={kanji.onyomi} kunyomi={kanji.kunyomi} />
      </Panel>

      <Panel title="Orden de trazos">
        <StrokeOrder strokes={kanji.strokes} />
      </Panel>

      <KanjiCredits />
    </>
  );
}
