import type { ItemType, TopicCategory } from '../../generated/prisma/enums.js';

/**
 * Lo que recibe el LLM de una pestaña: texto e imágenes intercalados en su
 * posición original.
 *
 * Las imágenes llegan ya descargadas y reducidas; de eso se encarga la
 * ingesta, que además sustituye por su texto las que ya están en la caché de
 * `ImageAsset`. `imageId` es el identificador con el que el modelo devuelve el
 * texto extraído de cada imagen.
 */
export type LlmPart =
  | { readonly kind: 'text'; readonly text: string }
  | {
      readonly kind: 'image';
      readonly imageId: string;
      readonly mimeType: string;
      readonly data: Buffer;
    };

export interface ExtractedKanji {
  /** Lecturas on, en katakana, tal como las enseñó el curso. */
  readonly onyomi: readonly string[];
  /** Lecturas kun, en hiragana, tal como las enseñó el curso. */
  readonly kunyomi: readonly string[];
  /** Dato de referencia que el modelo puede alucinar: null antes que inventarlo. */
  readonly strokeCount: number | null;
  /** 5 = N5 … 1 = N1. Igual que `strokeCount`, null si no hay certeza. */
  readonly jlptLevel: number | null;
}

export interface ExtractedItem {
  readonly type: ItemType;
  readonly japanese: string;
  readonly reading: string | null;
  readonly meaning: string;
  readonly example: string | null;
  /** Etiqueta libre del tema sugerido; la taxonomía la convierte en un tema real. */
  readonly topicLabel: string;
  /** Solo en los ítems `KANJI`; null en el resto. */
  readonly kanji: ExtractedKanji | null;
}

export interface ImageText {
  readonly imageId: string;
  readonly text: string;
}

export interface Extraction {
  readonly items: readonly ExtractedItem[];
  /** Texto de cada imagen enviada, para guardarlo en `ImageAsset`. */
  readonly imageTexts: readonly ImageText[];
}

export interface LabelWithExamples {
  readonly label: string;
  /** Unos pocos ítems de la etiqueta, para que el modelo entienda qué agrupa. */
  readonly examples: readonly string[];
}

export interface ProposedTopic {
  /** kebab-case ASCII; es la clave natural del tema. */
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: TopicCategory;
  /** null en los temas de primer nivel. */
  readonly parentSlug: string | null;
}

export interface Taxonomy {
  readonly topics: readonly ProposedTopic[];
  /** Cada etiqueta de entrada, una sola vez, apuntando a un tema del árbol. */
  readonly labelMap: readonly { readonly label: string; readonly topicSlug: string }[];
}

export interface ItemToAssign {
  /** Identificador que elige quien llama, para casar la respuesta. */
  readonly key: string;
  readonly type: ItemType;
  readonly japanese: string;
  readonly meaning: string;
  readonly topicLabel: string;
}

/** Un tema que ya existe en la base. */
export type CatalogTopic = Omit<ProposedTopic, 'description'>;

export interface ItemAssignment {
  readonly key: string;
  /** Todos los temas del ítem, al menos uno. */
  readonly topicSlugs: readonly string[];
  /** El tema canónico (`ItemTopic.isPrimary`); está dentro de `topicSlugs`. */
  readonly primarySlug: string;
}

export interface TopicAssignment {
  readonly assignments: readonly ItemAssignment[];
  /** Temas que el modelo propone porque ninguno del catálogo encajaba. */
  readonly newTopics: readonly ProposedTopic[];
}

/**
 * Contrato con el LLM, independiente del proveedor. Toda respuesta llega ya
 * validada: si no cumple el contrato, el método lanza `LlmValidationError`.
 */
export interface LlmProvider {
  extractStudyItems(parts: readonly LlmPart[]): Promise<Extraction>;
  buildTaxonomy(labels: readonly LabelWithExamples[]): Promise<Taxonomy>;
  assignToTopics(
    items: readonly ItemToAssign[],
    catalog: readonly CatalogTopic[],
  ): Promise<TopicAssignment>;
}

/** Token de inyección: quien consume el módulo pide la interfaz, no Gemini. */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
