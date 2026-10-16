import type { JmdictEntry, JmdictSense, VocabularySource, WallerWord } from '../types/vocabulary.js';

// Acepciones que no sirven para estudiar: si una palabra solo tiene de estas,
// se quedan todas.
const DISCARDED_MISC: ReadonlySet<string> = new Set(['arch', 'obs', 'hist', 'rare']);

// Bastan para el significado y mantienen corto lo que se traduce.
const MAX_SENSES = 8;

export const vocabularyKey = (japanese: string, reading: string): string => `${japanese}|${reading}`;

/**
 * Las acepciones que valen para esa grafía y lectura. Una palabra que va en
 * kana no toma las restringidas a una grafía con kanji.
 */
export function sensesFor(entry: JmdictEntry, kanji: string, reading: string): JmdictSense[] {
  const applicable = entry.senses.filter(
    (sense) =>
      (sense.kanjiRestrictions.length === 0 || sense.kanjiRestrictions.includes(kanji)) &&
      (sense.readingRestrictions.length === 0 || sense.readingRestrictions.includes(reading)),
  );
  const useful = applicable.filter((sense) => !sense.misc.some((tag) => DISCARDED_MISC.has(tag)));
  return (useful.length > 0 ? useful : applicable).slice(0, MAX_SENSES);
}

/**
 * Une las listas con JMdict. Recibe las palabras de la más fácil a la más
 * difícil: si una palabra está en dos niveles, se queda el más fácil. Falla,
 * listando todo, si una palabra no está en JMdict o no le queda acepción.
 */
export function buildVocabularySources(
  words: readonly WallerWord[],
  entries: ReadonlyMap<number, JmdictEntry>,
): VocabularySource[] {
  const problems: string[] = [];
  const byKey = new Map<string, VocabularySource>();

  for (const word of words) {
    const japanese = word.kanji || word.kana;
    const key = vocabularyKey(japanese, word.kana);
    if (byKey.has(key)) {
      continue;
    }
    const entry = entries.get(word.seq);
    if (!entry) {
      problems.push(`${key} (N${word.level}): no está en JMdict la entrada ${word.seq}`);
      continue;
    }
    const senses = sensesFor(entry, word.kanji, word.kana);
    if (senses.length === 0) {
      problems.push(`${key} (N${word.level}): ninguna acepción de ${word.seq} vale para esa grafía`);
      continue;
    }
    byKey.set(key, { key, level: word.level, seq: word.seq, japanese, reading: word.kana, senses });
  }

  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }
  return [...byKey.values()];
}
