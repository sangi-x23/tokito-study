import type { CatalogTopic, ExtractedItem, ItemToAssign, ProposedTopic } from '../../llm';
import type { PlannedItem, PlannedTopic } from '../types/import-plan';
import type { ItemRef, SectionPlan, SectionPlanInput } from '../types/section-plan';
import { parseClassDate } from './class-date';
import { DEFAULT_KANJI_TOPIC } from './import-plan';
import { itemKey, normalizeJapanese } from './item-key';

/** Normaliza `japanese` y deja cada ítem una sola vez; manda la primera aparición. */
export function uniqueItems(items: readonly ExtractedItem[]): ExtractedItem[] {
  const seen = new Set<string>();
  const unique: ExtractedItem[] = [];

  for (const item of items) {
    const japanese = normalizeJapanese(item.japanese);
    const key = itemKey(item.type, japanese);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ ...item, japanese });
    }
  }

  return unique;
}

/** La clave que viaja al LLM; legible para que el modelo la devuelva tal cual. */
const assignmentKey = (item: ItemRef): string => `${item.type}:${item.japanese}`;

export function toItemsToAssign(items: readonly ExtractedItem[]): ItemToAssign[] {
  return items.map((item) => ({
    key: assignmentKey(item),
    type: item.type,
    japanese: item.japanese,
    meaning: item.meaning,
    topicLabel: item.topicLabel,
  }));
}

/**
 * Arma lo que hay que escribir para una pestaña nueva o modificada.
 *
 * Los ítems que ya existen solo ganan la aparición en esta clase: su
 * significado, sus lecturas y sus temas no se tocan, porque los del bootstrap
 * se revisaron a mano. Los nuevos van a los temas que asignó el LLM, con el
 * primario primero, y se ponen al final de cada tema. Los temas nuevos van
 * detrás de sus hermanos.
 *
 * Igual que en el bootstrap, todo kanji termina también en un tema de
 * categoría KANJI.
 */
export function buildSectionPlan(input: SectionPlanInput): SectionPlan {
  const { section, catalog, assignment } = input;
  const problems: string[] = [];

  const catalogSlugs = new Set(catalog.map((topic) => topic.slug));
  const newTopics: ProposedTopic[] = assignment.newTopics.filter((topic) => !catalogSlugs.has(topic.slug));
  const allTopics: CatalogTopic[] = [...catalog, ...newTopics];
  const categoryOf = (slug: string) => allTopics.find((topic) => topic.slug === slug)?.category;
  const byKey = new Map(assignment.assignments.map((entry) => [entry.key, entry]));

  const drafts: { item: ExtractedItem; slugs: string[] }[] = [];

  for (const item of input.items) {
    if (input.existingKeys.has(itemKey(item.type, item.japanese))) {
      continue;
    }

    const entry = byKey.get(assignmentKey(item));
    if (!entry) {
      problems.push(`falta la asignación de "${item.japanese}"`);
      continue;
    }

    const slugs = [entry.primarySlug, ...entry.topicSlugs.filter((slug) => slug !== entry.primarySlug)];
    const unknown = slugs.filter((slug) => categoryOf(slug) === undefined);
    if (unknown.length > 0) {
      problems.push(`"${item.japanese}" apunta a temas que no existen: ${unknown.join(', ')}`);
      continue;
    }

    drafts.push({ item, slugs });
  }

  const kanjiWithoutKanjiTopic = drafts.filter(
    (draft) => draft.item.type === 'KANJI' && !draft.slugs.some((slug) => categoryOf(slug) === 'KANJI'),
  );

  if (kanjiWithoutKanjiTopic.length > 0) {
    let kanjiTopic = allTopics.find((topic) => topic.category === 'KANJI');

    if (!kanjiTopic) {
      if (categoryOf(DEFAULT_KANJI_TOPIC.slug) !== undefined) {
        problems.push(`hay un tema "${DEFAULT_KANJI_TOPIC.slug}" pero no es de categoría KANJI`);
      } else {
        newTopics.push(DEFAULT_KANJI_TOPIC);
        allTopics.push(DEFAULT_KANJI_TOPIC);
        kanjiTopic = DEFAULT_KANJI_TOPIC;
      }
    }

    if (kanjiTopic) {
      for (const draft of kanjiWithoutKanjiTopic) {
        draft.slugs.push(kanjiTopic.slug);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `No se puede armar el plan de "${section.title}":\n${problems.map((problem) => `  - ${problem}`).join('\n')}`,
    );
  }

  const nextTopicPosition = new Map<string | null, number>();
  for (const topic of catalog) {
    const next = nextTopicPosition.get(topic.parentSlug) ?? 0;
    nextTopicPosition.set(topic.parentSlug, Math.max(next, topic.position + 1));
  }
  const topics: PlannedTopic[] = newTopics.map((topic) => {
    const position = nextTopicPosition.get(topic.parentSlug) ?? 0;
    nextTopicPosition.set(topic.parentSlug, position + 1);
    return { ...topic, position };
  });

  const nextItemPosition = new Map(input.nextItemPosition);
  const items: PlannedItem[] = drafts.map(({ item, slugs }) => ({
    type: item.type,
    japanese: item.japanese,
    reading: item.reading,
    meaning: item.meaning,
    example: item.example,
    kanji: item.kanji,
    tabIds: [section.tabId],
    topics: slugs.map((slug, index) => {
      const position = nextItemPosition.get(slug) ?? 0;
      nextItemPosition.set(slug, position + 1);
      return { slug, isPrimary: index === 0, position };
    }),
  }));

  return {
    plan: {
      sections: [{ ...section, classDate: parseClassDate(section.title, input.now ?? new Date()) }],
      topics,
      items,
      images: input.images,
    },
    itemRefs: input.items.map((item) => ({ type: item.type, japanese: item.japanese })),
  };
}
