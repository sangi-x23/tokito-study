import type { KanjiGrade } from '@tokito/shared';

/** Un kanji jōyō tal como lo trae KANJIDIC2, antes de unirle los trazos. */
export interface KanjidicEntry {
  readonly character: string;
  readonly grade: KanjiGrade;
  readonly frequency: number | null;
  /** En español. Vacío si KANJIDIC2 no los tiene: el seed los completa. */
  readonly meanings: readonly string[];
  /** En inglés, solo para avisar qué falta traducir. */
  readonly englishMeanings: readonly string[];
  readonly onyomi: readonly string[];
  readonly kunyomi: readonly string[];
}

/** Un kanji listo para escribir en la base. */
export interface KanjiSeed {
  readonly character: string;
  readonly grade: number;
  readonly frequency: number | null;
  readonly meanings: readonly string[];
  readonly onyomi: readonly string[];
  readonly kunyomi: readonly string[];
  readonly strokes: readonly string[];
}

/** Lo que el seed necesita leer de cada fila existente para compararla. */
export interface StoredKanji extends KanjiSeed {
  readonly id: string;
}

export interface KanjiSeedPlan {
  readonly create: readonly KanjiSeed[];
  readonly update: readonly { readonly id: string; readonly kanji: KanjiSeed }[];
  readonly unchanged: number;
  /** Filas de la base que ya no son jōyō. No se borran: se avisan. */
  readonly orphaned: readonly string[];
}
