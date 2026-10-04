import type { Prisma } from '../../generated/prisma/client';
import { itemKey } from './item-key';
import type { SectionPlan } from './section-plan';
import { writePlan, type DocumentMeta, type WriteSummary } from './write-plan';

export interface SectionWriteSummary extends WriteSummary {
  /** Apariciones quitadas: ítems que ya no están en la pestaña. */
  readonly occurrencesRemoved: number;
}

/**
 * Escribe una pestaña de la ingesta semanal dentro de una transacción.
 *
 * `writePlan` crea la pestaña, los temas y los ítems nuevos. Después se
 * rehacen las apariciones de la pestaña con todos sus ítems, nuevos y
 * existentes: si una clase editada deja de mencionar un ítem, pierde esa
 * aparición. El ítem y sus temas no se borran nunca.
 */
export async function writeSectionPlan(
  tx: Prisma.TransactionClient,
  document: DocumentMeta,
  sectionPlan: SectionPlan,
  now: Date = new Date(),
): Promise<SectionWriteSummary> {
  const [section] = sectionPlan.plan.sections;
  if (!section || sectionPlan.plan.sections.length !== 1) {
    throw new Error('El plan de una pestaña debe traer exactamente una pestaña');
  }

  const written = await writePlan(tx, document, sectionPlan.plan, now);

  const saved = await tx.section.findFirstOrThrow({
    where: { tabId: section.tabId, document: { googleDocId: document.googleDocId } },
    select: { id: true },
  });

  const wanted = new Set(sectionPlan.itemRefs.map((item) => itemKey(item.type, item.japanese)));
  const found =
    wanted.size === 0
      ? []
      : await tx.studyItem.findMany({
          where: { japanese: { in: [...new Set(sectionPlan.itemRefs.map((item) => item.japanese))] } },
          select: { id: true, type: true, japanese: true },
        });
  const itemIds = found.filter((item) => wanted.has(itemKey(item.type, item.japanese))).map((item) => item.id);

  if (itemIds.length !== wanted.size) {
    throw new Error(`Faltan ítems de "${section.title}" en la base después de escribirlos`);
  }

  const added = await tx.itemOccurrence.createMany({
    data: itemIds.map((itemId) => ({ itemId, sectionId: saved.id })),
    skipDuplicates: true,
  });
  const removed = await tx.itemOccurrence.deleteMany({
    where: { sectionId: saved.id, itemId: { notIn: itemIds } },
  });

  return { ...written, occurrences: written.occurrences + added.count, occurrencesRemoved: removed.count };
}
