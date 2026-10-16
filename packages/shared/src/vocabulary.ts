// Contratos del vocabulario por nivel del JLPT (`apps/api/src/vocabulary`).
// Los consume la sección Vocabulario de `apps/web`.

/** Nivel del JLPT: 5 es el más fácil (N5) y 1 el más difícil (N1). */
export type JlptLevel = 1 | 2 | 3 | 4 | 5;

/** Lo que muestra cada fila de la lista de un nivel. */
export interface VocabularySummary {
  readonly id: string;
  /** Como se escribe normalmente: 会う, パン, ありがとう. */
  readonly japanese: string;
  /** Solo en kana: en hiragana, o en katakana si la palabra se escribe así. */
  readonly reading: string;
  /** Traducciones cortas al español, de la más a la menos usual. */
  readonly equivalents: readonly string[];
}

/** `GET /vocabulary/levels/:level` */
export interface VocabularyLevelList {
  readonly level: JlptLevel;
  /** En orden del silabario, por la lectura. */
  readonly words: readonly VocabularySummary[];
}

export interface VocabularyExample {
  readonly japanese: string;
  readonly spanish: string;
  /** La oración en japonés en Tatoeba (CC BY 2.0 FR): su página cita al autor. */
  readonly tatoebaId: number;
  /**
   * La traducción al español en Tatoeba, si la hay. Null cuando la traducción
   * es nuestra, hecha a partir de la inglesa.
   */
  readonly spanishTatoebaId: number | null;
}

/** `GET /vocabulary/words/:id` */
export interface VocabularyWord extends VocabularySummary {
  readonly level: JlptLevel;
  /** En español: «sustantivo», «verbo godan», «transitivo»… */
  readonly partsOfSpeech: readonly string[];
  /** Tiene kanji, pero suele escribirse solo en kana. */
  readonly usuallyKana: boolean;
  /** Qué significa y cómo se usa, con sus matices. */
  readonly meaning: string;
  readonly examples: readonly VocabularyExample[];
}
