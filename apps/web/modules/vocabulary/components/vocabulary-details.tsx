import type { VocabularyExample, VocabularyWord } from '@tokito/shared';
import type { ReactNode } from 'react';
import { findLevel } from '../levels';
import { VocabularyCredits } from './vocabulary-credits';

const tatoebaUrl = (id: number): string => `https://tatoeba.org/es/sentences/show/${id}`;

function Panel({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium tracking-wide text-ink-subtle uppercase">{title}</h3>
      {children}
    </section>
  );
}

/** Una oración con su traducción y, como pide la licencia de Tatoeba, el enlace que cita al autor. */
function Example({ example }: { example: VocabularyExample }): ReactNode {
  const link = 'underline hover:text-ink';
  return (
    <li className="flex flex-col gap-1">
      <p lang="ja" className="text-lg">
        {example.japanese}
      </p>
      <p className="text-ink-soft">{example.spanish}</p>
      <p className="text-xs text-ink-subtle">
        <a href={tatoebaUrl(example.tatoebaId)} target="_blank" rel="noreferrer" className={link}>
          Oración de Tatoeba
        </a>
        {' · '}
        {example.spanishTatoebaId ? (
          <a href={tatoebaUrl(example.spanishTatoebaId)} target="_blank" rel="noreferrer" className={link}>
            traducción de Tatoeba
          </a>
        ) : (
          'traducción nuestra'
        )}
      </p>
    </li>
  );
}

/** Nivel, categorías gramaticales y si suele ir en kana, en una línea. */
export function VocabularyFacts({ word }: { word: VocabularyWord }): ReactNode {
  const facts = [
    findLevel(word.level).label,
    ...word.partsOfSpeech,
    word.usuallyKana ? 'suele escribirse solo en kana' : null,
  ].filter(Boolean);
  return <p className="text-sm text-ink-subtle">{facts.join(' · ')}</p>;
}

/** El cuerpo del modal de una palabra: significado, ejemplos y créditos. */
export function VocabularyDetails({ word }: { word: VocabularyWord }): ReactNode {
  return (
    <>
      <Panel title="Significado">
        <p className="leading-relaxed">{word.meaning}</p>
      </Panel>

      {word.examples.length > 0 && (
        <Panel title="Ejemplos">
          <ul className="flex flex-col gap-4">
            {word.examples.map((example) => (
              <Example key={example.tatoebaId} example={example} />
            ))}
          </ul>
        </Panel>
      )}

      <VocabularyCredits />
    </>
  );
}
