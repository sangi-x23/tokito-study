import type { JlptLevel, VocabularyLevelList, VocabularyWord } from '@tokito/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { examplesSchema } from '../schemas/examples.schema.js';

/** Lo que hace falta de una palabra para una fila de la lista. */
export const vocabularySummarySelect = {
  id: true,
  japanese: true,
  reading: true,
  equivalents: true,
} satisfies Prisma.VocabularySelect;

export type VocabularySummaryRow = Prisma.VocabularyGetPayload<{ select: typeof vocabularySummarySelect }>;

// La colación japonesa ordena por el silabario sin distinguir hiragana de
// katakana y trata la ー como alargamiento de la vocal anterior.
const collator = new Intl.Collator('ja');

/** Las palabras de un nivel en orden del silabario, por la lectura. */
export function toVocabularyLevelList(level: JlptLevel, rows: readonly VocabularySummaryRow[]): VocabularyLevelList {
  const words = [...rows]
    .sort((a, b) => collator.compare(a.reading, b.reading) || collator.compare(a.japanese, b.japanese))
    .map((row) => ({ id: row.id, japanese: row.japanese, reading: row.reading, equivalents: row.equivalents }));

  return { level, words };
}

export const vocabularyWordSelect = {
  ...vocabularySummarySelect,
  level: true,
  partsOfSpeech: true,
  usuallyKana: true,
  meaning: true,
  examples: true,
} satisfies Prisma.VocabularySelect;

export type VocabularyWordRow = Prisma.VocabularyGetPayload<{ select: typeof vocabularyWordSelect }>;

export function toVocabularyWord(row: VocabularyWordRow): VocabularyWord {
  return {
    id: row.id,
    japanese: row.japanese,
    reading: row.reading,
    equivalents: row.equivalents,
    level: row.level as JlptLevel,
    partsOfSpeech: row.partsOfSpeech,
    usuallyKana: row.usuallyKana,
    meaning: row.meaning,
    examples: examplesSchema.parse(row.examples),
  };
}
