import type {
  ClassRef,
  ItemDetail,
  ItemSummary,
  ItemTopicRef,
  RelatedWord,
  TopicSummary,
} from '@tokito/shared';
import type { Prisma } from '../../generated/prisma/client.js';

/** Lo que hace falta de un ítem para `ItemSummary`. */
export const itemSummaryInclude = {
  kanji: true,
  // Solo título, fecha y orden: el `rawText` de la pestaña nunca sale por la API.
  occurrences: { select: { section: { select: { title: true, classDate: true, position: true } } } },
  topics: { where: { isPrimary: true }, select: { topic: { select: { slug: true, name: true } } } },
} satisfies Prisma.StudyItemInclude;

/** Lo mismo que `itemSummaryInclude`, pero con todos sus temas. */
export const itemDetailInclude = {
  ...itemSummaryInclude,
  topics: { select: { isPrimary: true, topic: { select: { slug: true, name: true } } } },
} satisfies Prisma.StudyItemInclude;

/** Lo que hace falta de un tema para `TopicSummary`. */
export const topicSummarySelect = {
  slug: true,
  name: true,
  description: true,
  category: true,
  _count: { select: { items: true } },
} satisfies Prisma.TopicSelect;

export type ItemSummaryRow = Prisma.StudyItemGetPayload<{ include: typeof itemSummaryInclude }>;
export type ItemDetailRow = Prisma.StudyItemGetPayload<{ include: typeof itemDetailInclude }>;
export type TopicSummaryRow = Prisma.TopicGetPayload<{ select: typeof topicSummarySelect }>;

export function toTopicSummary(row: TopicSummaryRow): TopicSummary {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    itemCount: row._count.items,
  };
}

/** `classDate` se guarda a medianoche UTC; solo importa el día. */
const toDateOnly = (date: Date | null): string | null => date?.toISOString().slice(0, 10) ?? null;

function toClasses(occurrences: ItemSummaryRow['occurrences']): ClassRef[] {
  return occurrences
    .map((occurrence) => occurrence.section)
    .sort((a, b) => a.position - b.position)
    .map((section) => ({ title: section.title, classDate: toDateOnly(section.classDate) }));
}

function toItemBase(row: ItemSummaryRow | ItemDetailRow): Omit<ItemSummary, 'primaryTopic'> {
  return {
    id: row.id,
    type: row.type,
    japanese: row.japanese,
    reading: row.reading,
    meaning: row.meaning,
    example: row.example,
    kanji: row.kanji
      ? {
          onyomi: row.kanji.onyomi,
          kunyomi: row.kanji.kunyomi,
          strokeCount: row.kanji.strokeCount,
          jlptLevel: row.kanji.jlptLevel,
        }
      : null,
    classes: toClasses(row.occurrences),
  };
}

export function toItemSummary(row: ItemSummaryRow): ItemSummary {
  return { ...toItemBase(row), primaryTopic: row.topics[0]?.topic ?? null };
}

export function toItemDetail(row: ItemDetailRow, relatedWords: readonly RelatedWord[]): ItemDetail {
  const topics: ItemTopicRef[] = row.topics
    .map((link) => ({ slug: link.topic.slug, name: link.topic.name, isPrimary: link.isPrimary }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name, 'es'));
  const primary = topics.find((topic) => topic.isPrimary);

  return {
    ...toItemBase(row),
    primaryTopic: primary ? { slug: primary.slug, name: primary.name } : null,
    topics,
    relatedWords,
  };
}
