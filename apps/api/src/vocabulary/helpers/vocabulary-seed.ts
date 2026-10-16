import type { Prisma } from '../../generated/prisma/client.js';
import type { Translation } from '../schemas/translation.schema.js';
import type { StoredVocabulary, VocabularySeed, VocabularySeedPlan, VocabularySource } from '../types/vocabulary.js';
import { partsOfSpeech } from './part-of-speech.js';
import { currentExamples } from './translations.js';
import { vocabularyKey } from './vocabulary-sources.js';

const HAS_KANJI = /\p{Script=Han}/u;

/**
 * Une cada palabra con su traducción. Falla, listando todo, si a una palabra
 * le falta la traducción, si la que tiene salió de un inglés que JMdict ya
 * cambió o si JMdict usa una categoría gramatical sin nombre en español.
 */
export function buildVocabularySeeds(
  sources: readonly VocabularySource[],
  translations: ReadonlyMap<string, Translation>,
): VocabularySeed[] {
  const missing: string[] = [];
  const stale: string[] = [];
  const unknown = new Set<string>();

  const seeds = sources.flatMap((source): VocabularySeed[] => {
    const translation = translations.get(source.key);
    if (!translation) {
      missing.push(source.key);
      return [];
    }
    const chosen = currentExamples(source, translation);
    if (!chosen) {
      stale.push(source.key);
      return [];
    }

    return [
      {
        japanese: source.japanese,
        reading: source.reading,
        level: source.level,
        jmdictSeq: source.seq,
        partsOfSpeech: partsOfSpeech(source.senses, unknown),
        usuallyKana: HAS_KANJI.test(source.japanese) && (source.senses[0]?.misc.includes('uk') ?? false),
        equivalents: translation.equivalents,
        meaning: translation.meaning,
        examples: translation.examples.map((example, index) => ({
          japanese: chosen[index]!.japanese,
          spanish: example.spanish,
          tatoebaId: example.tatoebaId,
          spanishTatoebaId: example.spanishTatoebaId,
        })),
      },
    ];
  });

  const problems = [
    missing.length > 0 ? `Sin traducción (${missing.length}), corre vocab:translate: ${missing.slice(0, 20).join(' ')}` : '',
    stale.length > 0 ? `Traducción vieja (${stale.length}), corre vocab:translate: ${stale.slice(0, 20).join(' ')}` : '',
    unknown.size > 0 ? `Categorías de JMdict sin nombre en part-of-speech.ts: ${[...unknown].join(' ')}` : '',
  ].filter(Boolean);
  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }
  return seeds;
}

const FIELDS = ['level', 'jmdictSeq', 'partsOfSpeech', 'usuallyKana', 'equivalents', 'meaning', 'examples'] as const;

// Postgres no conserva el orden de las claves de un jsonb, así que los
// ejemplos se comparan con las claves ordenadas.
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_, inner: unknown) =>
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => (a < b ? -1 : 1)))
      : inner,
  );

const sameWord = (a: VocabularySeed, b: StoredVocabulary): boolean =>
  FIELDS.every((field) => canonical(a[field]) === canonical(b[field]));

/** Compara lo que define el seed con lo que hay en la base, por `japanese` y `reading`. */
export function planVocabularySeed(
  seeds: readonly VocabularySeed[],
  stored: readonly StoredVocabulary[],
): VocabularySeedPlan {
  const byKey = new Map(stored.map((word) => [vocabularyKey(word.japanese, word.reading), word]));
  const create: VocabularySeed[] = [];
  const update: { id: string; word: VocabularySeed }[] = [];
  let unchanged = 0;

  for (const word of seeds) {
    const existing = byKey.get(vocabularyKey(word.japanese, word.reading));
    if (!existing) {
      create.push(word);
    } else if (sameWord(word, existing)) {
      unchanged++;
    } else {
      update.push({ id: existing.id, word });
    }
  }

  const defined = new Set(seeds.map((word) => vocabularyKey(word.japanese, word.reading)));
  const orphaned = [...byKey.keys()].filter((key) => !defined.has(key));

  return { create, update, unchanged, orphaned };
}

// Unas 8 000 palabras con sus ejemplos no caben cómodas en una sola consulta.
const CREATE_CHUNK = 1000;

/**
 * Aplica el plan dentro de una transacción: crea lo nuevo por lotes y
 * actualiza solo lo que cambió, sin recrear filas.
 */
export async function writeVocabularySeed(tx: Prisma.TransactionClient, plan: VocabularySeedPlan): Promise<void> {
  for (const { id, word } of plan.update) {
    await tx.vocabulary.update({ where: { id }, data: toData(word) });
  }
  for (let start = 0; start < plan.create.length; start += CREATE_CHUNK) {
    await tx.vocabulary.createMany({ data: plan.create.slice(start, start + CREATE_CHUNK).map(toData) });
  }
}

const toData = (word: VocabularySeed): Prisma.VocabularyCreateManyInput => ({
  japanese: word.japanese,
  reading: word.reading,
  level: word.level,
  jmdictSeq: word.jmdictSeq,
  partsOfSpeech: [...word.partsOfSpeech],
  usuallyKana: word.usuallyKana,
  equivalents: [...word.equivalents],
  meaning: word.meaning,
  examples: word.examples.map((example) => ({ ...example })),
});
