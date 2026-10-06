import type { ItemType } from '../../generated/prisma/enums';
import type { CatalogTopic, ExtractedItem, TopicAssignment } from '../../llm';
import type { ImportPlan } from './import-plan';

/** Un tema que ya está en la base, con su orden entre hermanos. */
export interface CatalogEntry extends CatalogTopic {
  readonly position: number;
}

export interface SectionSource {
  readonly tabId: string;
  readonly title: string;
  readonly position: number;
  readonly contentHash: string;
  readonly rawText: string;
}

export interface ItemRef {
  readonly type: ItemType;
  readonly japanese: string;
}

/** Lo que escribe la ingesta de una pestaña. */
export interface SectionPlan {
  /** La pestaña, los temas nuevos, los ítems nuevos y las imágenes. */
  readonly plan: ImportPlan;
  /** Todos los ítems de la pestaña, nuevos y existentes: definen sus apariciones. */
  readonly itemRefs: readonly ItemRef[];
}

export interface SectionPlanInput {
  readonly section: SectionSource;
  /** Los ítems extraídos, ya pasados por `uniqueItems`. */
  readonly items: readonly ExtractedItem[];
  /** `itemKey` de los ítems que ya están en la base. */
  readonly existingKeys: ReadonlySet<string>;
  /** Respuesta de `assignToTopics` para los ítems nuevos. */
  readonly assignment: TopicAssignment;
  readonly catalog: readonly CatalogEntry[];
  /** Siguiente posición libre dentro de cada tema, por slug; si falta, 0. */
  readonly nextItemPosition: ReadonlyMap<string, number>;
  readonly images: readonly { readonly hash: string; readonly text: string }[];
  readonly now?: Date;
}
