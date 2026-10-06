// Contratos de la API pública de lectura (Fase 6). Los produce `apps/api`
// y los consume `apps/web`.

export type TopicCategory = 'GRAMMAR' | 'VOCABULARY' | 'KANJI' | 'EXPRESSION' | 'OTHER';

export type ItemType = 'WORD' | 'KANJI' | 'GRAMMAR_POINT' | 'PHRASE';

/** Lo mínimo para enlazar a un tema. */
export interface TopicRef {
  readonly slug: string;
  readonly name: string;
}

export interface TopicSummary extends TopicRef {
  readonly description: string | null;
  readonly category: TopicCategory;
  /** Ítems del propio tema, sin contar los de sus subtemas. */
  readonly itemCount: number;
}

/** Un tema de primer nivel con sus subtemas: la taxonomía tiene dos niveles. */
export interface TopicNode extends TopicSummary {
  readonly children: readonly TopicSummary[];
}

/** Una clase donde apareció un ítem. */
export interface ClassRef {
  readonly title: string;
  /** `YYYY-MM-DD`, o null si el título de la pestaña no trae fecha. */
  readonly classDate: string | null;
}

export interface KanjiInfo {
  /** Lecturas on, en katakana, tal como las enseñó el curso. */
  readonly onyomi: readonly string[];
  /** Lecturas kun, en hiragana, tal como las enseñó el curso. */
  readonly kunyomi: readonly string[];
  readonly strokeCount: number | null;
  /** 5 = N5 … 1 = N1. */
  readonly jlptLevel: number | null;
}

export interface ItemSummary {
  readonly id: string;
  readonly type: ItemType;
  readonly japanese: string;
  readonly reading: string | null;
  readonly meaning: string;
  readonly example: string | null;
  /** Solo en los ítems `KANJI`. */
  readonly kanji: KanjiInfo | null;
  /** En el orden del curso. */
  readonly classes: readonly ClassRef[];
  /** El tema canónico del ítem, para el breadcrumb. */
  readonly primaryTopic: TopicRef | null;
}

/** `GET /topics/:slug` */
export interface TopicDetail extends TopicSummary {
  readonly parent: TopicRef | null;
  readonly children: readonly TopicSummary[];
  /** Los ítems del propio tema, en su orden dentro del tema. */
  readonly items: readonly ItemSummary[];
}

export interface ItemTopicRef extends TopicRef {
  readonly isPrimary: boolean;
}

/** Una palabra del curso que usa un kanji. */
export interface RelatedWord {
  readonly id: string;
  readonly japanese: string;
  readonly reading: string | null;
  readonly meaning: string;
}

/** `GET /items/:id` */
export interface ItemDetail extends ItemSummary {
  /** Todos sus temas, el primario primero. */
  readonly topics: readonly ItemTopicRef[];
  /** Si es un kanji, las palabras del curso que lo usan; si no, vacío. */
  readonly relatedWords: readonly RelatedWord[];
}
