import type { KanjiDetail } from '@tokito/shared';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { routes } from '@/lib/routes';
import { StrokeOrder } from '@/modules/writing/components/stroke-order';
import { KanjiCredits } from '../components/kanji-credits';
import { KanjiReadings } from '../components/kanji-readings';
import { findGrade } from '../kanji-grades';
import { writingSection } from '../section';

function Panel({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</h2>
      {children}
    </section>
  );
}

/** Un kanji: significados, lecturas y orden de trazos. */
export function KanjiView({ kanji }: { kanji: KanjiDetail }): ReactNode {
  const grade = findGrade(kanji.grade);
  const facts = [
    `${kanji.strokes.length} trazos`,
    grade.label,
    kanji.frequency ? `n.º ${kanji.frequency} en frecuencia de uso` : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          crumbs={[
            { label: writingSection.label, href: writingSection.href },
            { label: 'Kanji', href: routes.kanji },
            { label: grade.label, href: routes.kanjiGrade(grade.slug) },
            { label: kanji.character },
          ]}
        />
        <h1 lang="ja" className="text-6xl font-medium">
          {kanji.character}
        </h1>
        <p className="text-xl">{kanji.meanings.join(', ')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{facts.join(' · ')}</p>
      </div>

      <Panel title="Lecturas">
        <KanjiReadings onyomi={kanji.onyomi} kunyomi={kanji.kunyomi} />
      </Panel>

      <Panel title="Orden de trazos">
        <StrokeOrder strokes={kanji.strokes} />
      </Panel>

      <KanjiCredits />
    </div>
  );
}
