import type { ExtractedItem, ExtractedKanji, ProposedTopic } from '../../llm';
import type { ItemType } from '../../generated/prisma/enums';

/** Lo que dejó la extracción de una pestaña. */
export interface SectionExtraction {
  readonly tabId: string;
  readonly title: string;
  readonly position: number;
  readonly contentHash: string;
  readonly rawText: string;
  readonly items: readonly ExtractedItem[];
  /** Todas las imágenes de la pestaña con su texto, las nuevas y las de la caché. */
  readonly images: readonly { readonly hash: string; readonly text: string }[];
}

export interface PlannedSection {
  readonly tabId: string;
  readonly title: string;
  readonly position: number;
  readonly contentHash: string;
  readonly rawText: string;
  readonly classDate: Date | null;
}

export interface PlannedTopic extends ProposedTopic {
  /** Orden entre sus hermanos. */
  readonly position: number;
}

export interface PlannedItemTopic {
  readonly slug: string;
  readonly isPrimary: boolean;
  /** Orden del ítem dentro del tema. */
  readonly position: number;
}

/** Un ítem ya fusionado: una sola entrada aunque aparezca en varias pestañas. */
export interface PlannedItem {
  readonly type: ItemType;
  readonly japanese: string;
  readonly reading: string | null;
  readonly meaning: string;
  readonly example: string | null;
  readonly kanji: ExtractedKanji | null;
  readonly topics: readonly PlannedItemTopic[];
  /** Pestañas donde apareció, para `ItemOccurrence`. */
  readonly tabIds: readonly string[];
}

/** Todo lo que hay que escribir en la base, ya resuelto y validado. */
export interface ImportPlan {
  readonly sections: readonly PlannedSection[];
  readonly topics: readonly PlannedTopic[];
  readonly items: readonly PlannedItem[];
  readonly images: readonly { readonly hash: string; readonly text: string }[];
}
