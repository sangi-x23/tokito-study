import type { Prisma } from '../../generated/prisma/client';
import type { ImportPlan, PlannedItem } from '../types/import-plan';
import type { DocumentMeta, WriteSummary } from '../types/write-plan';

const itemKey = (type: string, japanese: string): string => `${type}\u0000${japanese}`;

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Escribe el plan dentro de una transacción.
 *
 * Todo es upsert por clave natural, nunca borrar y recrear: los IDs de temas e
 * ítems se mantienen estables entre corridas. Va por lotes (lee lo que existe,
 * crea lo nuevo con `createMany` y actualiza solo lo que cambió) porque cada
 * consulta a Neon cuesta unos 70 ms y una fila por consulta serían minutos.
 *
 * Lo único que se borra son enlaces `ItemTopic` de los ítems del plan que ya
 * no corresponden: si la taxonomía revisada movió un ítem de tema, debe dejar
 * de aparecer en el anterior.
 */
export async function writePlan(
  tx: Prisma.TransactionClient,
  document: DocumentMeta,
  plan: ImportPlan,
  now: Date = new Date(),
): Promise<WriteSummary> {
  const source = await tx.sourceDocument.upsert({
    where: { googleDocId: document.googleDocId },
    create: { googleDocId: document.googleDocId, title: document.title, lastRevision: document.revisionId },
    update: { title: document.title, lastRevision: document.revisionId },
  });

  // Son pocas pestañas: un upsert por pestaña basta.
  const sectionIds = new Map<string, string>();
  for (const section of plan.sections) {
    const data = {
      title: section.title,
      position: section.position,
      contentHash: section.contentHash,
      rawText: section.rawText,
      classDate: section.classDate,
      processedAt: now,
    };
    const saved = await tx.section.upsert({
      where: { documentId_tabId: { documentId: source.id, tabId: section.tabId } },
      create: { documentId: source.id, tabId: section.tabId, ...data },
      update: data,
    });
    sectionIds.set(section.tabId, saved.id);
  }

  const topics = await writeTopics(tx, plan);
  const items = await writeItems(tx, plan.items);
  await writeKanji(tx, plan.items, items.ids);
  const itemTopics = await writeItemTopics(tx, plan.items, items.ids, topics.ids);

  const occurrences = await tx.itemOccurrence.createMany({
    data: plan.items.flatMap((item) =>
      item.tabIds.map((tabId) => ({
        itemId: requireId(items.ids, itemKey(item.type, item.japanese)),
        sectionId: requireId(sectionIds, tabId),
      })),
    ),
    skipDuplicates: true,
  });

  // La caché de imágenes es inmutable por hash: lo que ya está, se queda.
  const images = await tx.imageAsset.createMany({
    data: plan.images.map((image) => ({ hash: image.hash, extractedText: image.text })),
    skipDuplicates: true,
  });

  return {
    sections: plan.sections.length,
    topics: topics.summary,
    items: items.summary,
    itemTopics,
    occurrences: occurrences.count,
    images: images.count,
  };
}

function requireId(ids: ReadonlyMap<string, string>, key: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`Falta el ID de "${key.replace('\u0000', ' ')}" al escribir el plan`);
  }
  return id;
}

async function writeTopics(tx: Prisma.TransactionClient, plan: ImportPlan) {
  const existing = new Map((await tx.topic.findMany()).map((topic) => [topic.slug, topic]));
  const ids = new Map([...existing].map(([slug, topic]) => [slug, topic.id]));
  const summary = { created: 0, updated: 0 };

  // Primero los de primer nivel, después sus hijos: un hijo necesita el ID
  // de su padre ya creado.
  const levels = [
    plan.topics.filter((topic) => topic.parentSlug === null),
    plan.topics.filter((topic) => topic.parentSlug !== null),
  ];

  for (const level of levels) {
    const toCreate = [];

    for (const topic of level) {
      const data = {
        name: topic.name,
        description: topic.description,
        category: topic.category,
        position: topic.position,
        parentId: topic.parentSlug === null ? null : requireId(ids, topic.parentSlug),
      };
      const current = existing.get(topic.slug);

      if (!current) {
        toCreate.push({ slug: topic.slug, ...data });
        continue;
      }

      const changed = (Object.keys(data) as (keyof typeof data)[]).some((key) => current[key] !== data[key]);
      if (changed) {
        await tx.topic.update({ where: { id: current.id }, data });
        summary.updated += 1;
      }
    }

    const created = await tx.topic.createManyAndReturn({ data: toCreate, select: { id: true, slug: true } });
    created.forEach((topic) => ids.set(topic.slug, topic.id));
    summary.created += created.length;
  }

  return { ids, summary };
}

async function writeItems(tx: Prisma.TransactionClient, items: readonly PlannedItem[]) {
  const found = await tx.studyItem.findMany({
    where: { japanese: { in: [...new Set(items.map((item) => item.japanese))] } },
  });
  const existing = new Map(found.map((item) => [itemKey(item.type, item.japanese), item]));
  const ids = new Map([...existing].map(([key, item]) => [key, item.id]));
  const summary = { created: 0, updated: 0 };
  const toCreate = [];

  for (const item of items) {
    const data = {
      reading: item.reading,
      meaning: item.meaning,
      example: item.example,
    };
    const current = existing.get(itemKey(item.type, item.japanese));

    if (!current) {
      toCreate.push({ type: item.type, japanese: item.japanese, ...data });
      continue;
    }

    if (current.reading !== data.reading || current.meaning !== data.meaning || current.example !== data.example) {
      await tx.studyItem.update({ where: { id: current.id }, data });
      summary.updated += 1;
    }
  }

  const created = await tx.studyItem.createManyAndReturn({
    data: toCreate,
    select: { id: true, type: true, japanese: true },
  });
  created.forEach((item) => ids.set(itemKey(item.type, item.japanese), item.id));
  summary.created = created.length;

  return { ids, summary };
}

async function writeKanji(
  tx: Prisma.TransactionClient,
  items: readonly PlannedItem[],
  itemIds: ReadonlyMap<string, string>,
): Promise<void> {
  const kanji = items.flatMap((item) =>
    item.kanji ? [{ itemId: requireId(itemIds, itemKey(item.type, item.japanese)), ...item.kanji }] : [],
  );
  if (kanji.length === 0) {
    return;
  }

  const existing = new Map(
    (await tx.kanjiDetail.findMany({ where: { itemId: { in: kanji.map((entry) => entry.itemId) } } })).map(
      (detail) => [detail.itemId, detail],
    ),
  );
  const toCreate = [];

  for (const entry of kanji) {
    const data = {
      onyomi: [...entry.onyomi],
      kunyomi: [...entry.kunyomi],
      strokeCount: entry.strokeCount,
      jlptLevel: entry.jlptLevel,
    };
    const current = existing.get(entry.itemId);

    if (!current) {
      toCreate.push({ itemId: entry.itemId, ...data });
    } else if (
      !sameJson([current.onyomi, current.kunyomi, current.strokeCount, current.jlptLevel], Object.values(data))
    ) {
      await tx.kanjiDetail.update({ where: { itemId: entry.itemId }, data });
    }
  }

  await tx.kanjiDetail.createMany({ data: toCreate });
}

async function writeItemTopics(
  tx: Prisma.TransactionClient,
  items: readonly PlannedItem[],
  itemIds: ReadonlyMap<string, string>,
  topicIds: ReadonlyMap<string, string>,
) {
  const desired = new Map<string, { itemId: string; topicId: string; isPrimary: boolean; position: number }>();
  for (const item of items) {
    const itemId = requireId(itemIds, itemKey(item.type, item.japanese));
    for (const topic of item.topics) {
      const topicId = requireId(topicIds, topic.slug);
      desired.set(`${itemId}:${topicId}`, { itemId, topicId, isPrimary: topic.isPrimary, position: topic.position });
    }
  }

  const current = await tx.itemTopic.findMany({ where: { itemId: { in: [...itemIds.values()] } } });
  const currentByKey = new Map(current.map((link) => [`${link.itemId}:${link.topicId}`, link]));
  let updated = 0;

  for (const [key, link] of desired) {
    const existing = currentByKey.get(key);
    if (existing && (existing.isPrimary !== link.isPrimary || existing.position !== link.position)) {
      await tx.itemTopic.update({
        where: { itemId_topicId: { itemId: link.itemId, topicId: link.topicId } },
        data: { isPrimary: link.isPrimary, position: link.position },
      });
      updated += 1;
    }
  }

  const stale = current.filter((link) => !desired.has(`${link.itemId}:${link.topicId}`));
  if (stale.length > 0) {
    await tx.itemTopic.deleteMany({
      where: { OR: stale.map((link) => ({ itemId: link.itemId, topicId: link.topicId })) },
    });
  }

  const created = await tx.itemTopic.createMany({
    data: [...desired].filter(([key]) => !currentByKey.has(key)).map(([, link]) => link),
  });

  return { created: created.count, updated, removed: stale.length };
}
