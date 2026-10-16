import type { VocabularyLevelList } from '@tokito/shared';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import type { JlptLevelEntry } from '@/modules/vocabulary/levels';
import { WordList } from '../components/word-list';
import { vocabularySection } from '../section';

/** Las palabras de un nivel, como un diccionario. */
export function LevelView({ level, list }: { level: JlptLevelEntry; list: VocabularyLevelList }): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Breadcrumb crumbs={[{ label: vocabularySection.label, href: vocabularySection.href }, { label: level.label }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Vocabulario {level.label}</h1>
        <p className="text-slate-600 dark:text-slate-400">{level.description}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{list.words.length} palabras, en orden del silabario</p>
      </div>
      <WordList words={list.words} />
    </div>
  );
}
