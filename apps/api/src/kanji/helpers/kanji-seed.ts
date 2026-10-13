import type { Prisma } from '../../generated/prisma/client.js';
import type { KanjidicEntry, KanjiSeed, KanjiSeedPlan, StoredKanji } from '../types/kanji.js';

/**
 * Une KANJIDIC2 con los trazos de KanjiVG. Los significados que KANJIDIC2
 * no trae en español salen de `spanish`. Falla, listando todo lo que falta,
 * si un kanji se queda sin trazos o sin significados.
 *
 * `unusedTranslations` son las entradas de `spanish` que ya no hacen falta.
 */
export function buildKanjiSeeds(
  entries: readonly KanjidicEntry[],
  strokes: ReadonlyMap<string, readonly string[]>,
  spanish: Readonly<Record<string, readonly string[]>>,
): { seeds: KanjiSeed[]; unusedTranslations: string[] } {
  const missingStrokes: string[] = [];
  const missingMeanings: string[] = [];
  const used = new Set<string>();

  const seeds = entries.map((entry): KanjiSeed => {
    const own = strokes.get(entry.character);
    if (!own) {
      missingStrokes.push(entry.character);
    }
    let meanings = entry.meanings;
    if (meanings.length === 0) {
      meanings = spanish[entry.character] ?? [];
      used.add(entry.character);
      if (meanings.length === 0) {
        missingMeanings.push(`${entry.character} (${entry.englishMeanings.join('; ')})`);
      }
    }
    return {
      character: entry.character,
      grade: entry.grade,
      frequency: entry.frequency,
      meanings,
      onyomi: entry.onyomi,
      kunyomi: entry.kunyomi,
      strokes: own ?? [],
    };
  });

  const problems = [
    missingStrokes.length > 0 ? `Sin trazos en KanjiVG: ${missingStrokes.join(' ')}` : '',
    missingMeanings.length > 0 ? `Sin significado en español, agrégalos a SPANISH_MEANINGS: ${missingMeanings.join(', ')}` : '',
  ].filter(Boolean);
  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }

  const unusedTranslations = Object.keys(spanish).filter((character) => !used.has(character));
  return { seeds, unusedTranslations };
}

const FIELDS = ['grade', 'frequency', 'meanings', 'onyomi', 'kunyomi', 'strokes'] as const;

const sameKanji = (a: KanjiSeed, b: KanjiSeed): boolean =>
  FIELDS.every((field) => JSON.stringify(a[field]) === JSON.stringify(b[field]));

/** Compara lo que define el seed con lo que hay en la base, por `character`. */
export function planKanjiSeed(seeds: readonly KanjiSeed[], stored: readonly StoredKanji[]): KanjiSeedPlan {
  const byCharacter = new Map(stored.map((kanji) => [kanji.character, kanji]));
  const create: KanjiSeed[] = [];
  const update: { id: string; kanji: KanjiSeed }[] = [];
  let unchanged = 0;

  for (const kanji of seeds) {
    const existing = byCharacter.get(kanji.character);
    if (!existing) {
      create.push(kanji);
    } else if (sameKanji(kanji, existing)) {
      unchanged++;
    } else {
      update.push({ id: existing.id, kanji });
    }
  }

  const defined = new Set(seeds.map((kanji) => kanji.character));
  const orphaned = stored.filter((kanji) => !defined.has(kanji.character)).map((kanji) => kanji.character);

  return { create, update, unchanged, orphaned };
}

/**
 * Aplica el plan dentro de una transacción: crea lo nuevo de una vez y
 * actualiza solo lo que cambió, sin recrear filas.
 */
export async function writeKanjiSeed(tx: Prisma.TransactionClient, plan: KanjiSeedPlan): Promise<void> {
  for (const { id, kanji } of plan.update) {
    await tx.kanji.update({ where: { id }, data: toData(kanji) });
  }
  if (plan.create.length > 0) {
    await tx.kanji.createMany({ data: plan.create.map(toData) });
  }
}

const toData = (kanji: KanjiSeed): Prisma.KanjiCreateManyInput => ({
  character: kanji.character,
  grade: kanji.grade,
  frequency: kanji.frequency,
  meanings: [...kanji.meanings],
  onyomi: [...kanji.onyomi],
  kunyomi: [...kanji.kunyomi],
  strokes: [...kanji.strokes],
});
