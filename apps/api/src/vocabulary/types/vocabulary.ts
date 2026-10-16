import type { JlptLevel } from '@tokito/shared';

/** Una fila de las listas de Waller: una palabra con su nivel y su entrada de JMdict. */
export interface WallerWord {
  readonly level: JlptLevel;
  readonly seq: number;
  readonly kana: string;
  /** Vacío si la palabra se escribe solo en kana. */
  readonly kanji: string;
}

export interface JmdictExample {
  readonly tatoebaId: number;
  readonly japanese: string;
  readonly english: string;
}

export interface JmdictSense {
  /** Nombres de las entidades de JMdict (`v5u`, `adj-i`), heredados de la acepción anterior si no trae. */
  readonly partsOfSpeech: readonly string[];
  /** Etiquetas como `uk` (se escribe en kana) o `arch` (arcaico). */
  readonly misc: readonly string[];
  readonly glosses: readonly string[];
  /** Notas de uso en inglés. */
  readonly info: readonly string[];
  /** Si no están vacías, la acepción solo vale para esas grafías o lecturas. */
  readonly kanjiRestrictions: readonly string[];
  readonly readingRestrictions: readonly string[];
  readonly examples: readonly JmdictExample[];
}

export interface JmdictEntry {
  readonly seq: number;
  readonly kanji: readonly string[];
  readonly readings: readonly string[];
  readonly senses: readonly JmdictSense[];
}

/** Una palabra de las listas unida a las acepciones de JMdict que le corresponden. */
export interface VocabularySource {
  /** `japanese|reading`, la clave natural. */
  readonly key: string;
  readonly level: JlptLevel;
  readonly seq: number;
  readonly japanese: string;
  readonly reading: string;
  readonly senses: readonly JmdictSense[];
}

/** Lo que recibe quien traduce una palabra: el inglés de JMdict y los ejemplos elegidos. */
export interface TranslationRequest {
  readonly key: string;
  readonly level: JlptLevel;
  readonly japanese: string;
  readonly reading: string;
  readonly senses: readonly {
    readonly partsOfSpeech: readonly string[];
    readonly misc: readonly string[];
    readonly glosses: readonly string[];
    readonly info: readonly string[];
  }[];
  readonly examples: readonly {
    readonly tatoebaId: number;
    readonly japanese: string;
    readonly english: string;
    /** La traducción de Tatoeba, si existe: se usa tal cual. */
    readonly spanish?: string;
    readonly spanishTatoebaId?: number;
  }[];
}

/** Una palabra lista para escribir en la base. */
export interface VocabularySeed {
  readonly japanese: string;
  readonly reading: string;
  readonly level: number;
  readonly jmdictSeq: number;
  readonly partsOfSpeech: readonly string[];
  readonly usuallyKana: boolean;
  readonly equivalents: readonly string[];
  readonly meaning: string;
  readonly examples: readonly {
    readonly japanese: string;
    readonly spanish: string;
    readonly tatoebaId: number;
    readonly spanishTatoebaId: number | null;
  }[];
}

/** Lo que el seed necesita leer de cada fila existente para compararla. */
export interface StoredVocabulary extends Omit<VocabularySeed, 'examples'> {
  readonly id: string;
  /** Json en la base: se compara serializado. */
  readonly examples: unknown;
}

export interface VocabularySeedPlan {
  readonly create: readonly VocabularySeed[];
  readonly update: readonly { readonly id: string; readonly word: VocabularySeed }[];
  readonly unchanged: number;
  /** Filas de la base que ya no están en las listas. No se borran: se avisan. */
  readonly orphaned: readonly string[];
}
