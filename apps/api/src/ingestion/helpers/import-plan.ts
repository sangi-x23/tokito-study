import { checkTopicTree, type ProposedTopic, type Taxonomy } from '../../llm';
import type {
  ImportPlan,
  PlannedItem,
  PlannedItemTopic,
  PlannedSection,
  PlannedTopic,
  SectionExtraction,
} from '../types/import-plan';
import { parseClassDate } from './class-date';
import { itemKey, normalizeJapanese } from './item-key';

// Tema que se crea si hay kanji y la taxonomía no trae ninguno de categoría
// KANJI: todo kanji tiene que poder practicarse desde un tema de kanji.
export const DEFAULT_KANJI_TOPIC: ProposedTopic = {
  slug: 'kanji',
  name: 'Kanji',
  description: 'Los kanji que se vieron en el curso.',
  category: 'KANJI',
  parentSlug: null,
};

interface ItemDraft {
  type: PlannedItem['type'];
  japanese: string;
  reading: string | null;
  meaning: string;
  example: string | null;
  kanji: PlannedItem['kanji'];
  topicSlugs: string[];
  tabIds: string[];
}

/**
 * Convierte las extracciones y la taxonomía revisada en el plan de escritura.
 *
 * Un ítem que aparece en varias pestañas se fusiona por `[type, japanese]`:
 * significado, ejemplo y lecturas salen de la primera aparición; los temas
 * son la unión de los de todas sus etiquetas y el primario es el de la
 * primera. Las pestañas se recorren en el orden del documento, así que "la
 * primera" es la clase donde se enseñó.
 *
 * Lanza un error si el resultado rompe una invariante: un ítem sin tema, un
 * tema que no existe o un árbol inválido.
 */
export function buildImportPlan(
  extractions: readonly SectionExtraction[],
  taxonomy: Taxonomy,
  now: Date = new Date(),
): ImportPlan {
  const ordered = [...extractions].sort((a, b) => a.position - b.position);
  const slugForLabel = new Map(taxonomy.labelMap.map((entry) => [entry.label, entry.topicSlug]));
  const topics: ProposedTopic[] = [...taxonomy.topics];
  const knownSlugs = new Set(topics.map((topic) => topic.slug));
  const problems: string[] = [];

  const drafts = new Map<string, ItemDraft>();

  for (const extraction of ordered) {
    for (const item of extraction.items) {
      const japanese = normalizeJapanese(item.japanese);
      const key = itemKey(item.type, japanese);
      const slug = slugForLabel.get(item.topicLabel);

      if (slug === undefined) {
        problems.push(`la etiqueta "${item.topicLabel}" (de ${japanese}) no está en labelMap`);
        continue;
      }
      if (!knownSlugs.has(slug)) {
        problems.push(`la etiqueta "${item.topicLabel}" apunta a "${slug}", que no está en topics`);
        continue;
      }

      const draft = drafts.get(key);
      if (!draft) {
        drafts.set(key, {
          type: item.type,
          japanese,
          reading: item.reading,
          meaning: item.meaning,
          example: item.example,
          kanji: item.kanji,
          topicSlugs: [slug],
          tabIds: [extraction.tabId],
        });
        continue;
      }

      if (!draft.topicSlugs.includes(slug)) {
        draft.topicSlugs.push(slug);
      }
      if (!draft.tabIds.includes(extraction.tabId)) {
        draft.tabIds.push(extraction.tabId);
      }
    }
  }

  // Los kanji van además a un tema de kanji, si su etiqueta no los llevó ya.
  const categoryOf = (slug: string) => topics.find((topic) => topic.slug === slug)?.category;
  const kanjiWithoutKanjiTopic = [...drafts.values()].filter(
    (draft) => draft.type === 'KANJI' && !draft.topicSlugs.some((slug) => categoryOf(slug) === 'KANJI'),
  );

  if (kanjiWithoutKanjiTopic.length > 0) {
    let kanjiTopic = topics.find((topic) => topic.category === 'KANJI');

    if (!kanjiTopic) {
      if (knownSlugs.has(DEFAULT_KANJI_TOPIC.slug)) {
        problems.push(`hay un tema "${DEFAULT_KANJI_TOPIC.slug}" pero no es de categoría KANJI`);
      } else {
        topics.push(DEFAULT_KANJI_TOPIC);
        knownSlugs.add(DEFAULT_KANJI_TOPIC.slug);
        kanjiTopic = DEFAULT_KANJI_TOPIC;
      }
    }

    if (kanjiTopic) {
      for (const draft of kanjiWithoutKanjiTopic) {
        draft.topicSlugs.push(kanjiTopic.slug);
      }
    }
  }

  problems.push(...checkTopicTree(topics));

  if (problems.length > 0) {
    throw new Error(`No se puede armar el plan de importación:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }

  // Posiciones: los temas, en el orden de la taxonomía entre sus hermanos;
  // los ítems, en el orden en que se enseñaron dentro de cada tema.
  const siblingCount = new Map<string | null, number>();
  const plannedTopics: PlannedTopic[] = topics.map((topic) => {
    const position = siblingCount.get(topic.parentSlug) ?? 0;
    siblingCount.set(topic.parentSlug, position + 1);
    return { ...topic, position };
  });

  const itemsInTopic = new Map<string, number>();
  const items: PlannedItem[] = [...drafts.values()].map((draft) => ({
    type: draft.type,
    japanese: draft.japanese,
    reading: draft.reading,
    meaning: draft.meaning,
    example: draft.example,
    kanji: draft.kanji,
    tabIds: draft.tabIds,
    topics: draft.topicSlugs.map((slug, index): PlannedItemTopic => {
      const position = itemsInTopic.get(slug) ?? 0;
      itemsInTopic.set(slug, position + 1);
      return { slug, isPrimary: index === 0, position };
    }),
  }));

  const sections: PlannedSection[] = ordered.map((extraction) => ({
    tabId: extraction.tabId,
    title: extraction.title,
    position: extraction.position,
    contentHash: extraction.contentHash,
    rawText: extraction.rawText,
    classDate: parseClassDate(extraction.title, now),
  }));

  const images = new Map<string, string>();
  for (const extraction of ordered) {
    for (const image of extraction.images) {
      if (!images.has(image.hash)) {
        images.set(image.hash, image.text);
      }
    }
  }

  return {
    sections,
    topics: plannedTopics,
    items,
    images: [...images].map(([hash, text]) => ({ hash, text })),
  };
}
