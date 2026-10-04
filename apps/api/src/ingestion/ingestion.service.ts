import { Inject, Injectable, Logger } from '@nestjs/common';
import { GoogleDocsService, type ParsedDocument } from '../google-docs';
import { LLM_PROVIDER, type Extraction, type LlmProvider, type TopicAssignment } from '../llm';
import { PrismaService } from '../prisma/prisma.service';
import { downloadImage, shrinkForLlm } from './helpers/images';
import { withIngestionRun } from './helpers/ingestion-run';
import { itemKey } from './helpers/item-key';
import { prepareSection, toLlmParts, type PreparedSection } from './helpers/prepare-section';
import { buildSectionPlan, toItemsToAssign, uniqueItems, type CatalogEntry } from './helpers/section-plan';
import { writeSectionPlan, type SectionWriteSummary } from './helpers/write-section';
import type { DocumentMeta } from './helpers/write-plan';

// Una pestaña con imágenes más la asignación puede pasar de 200 s, y Vercel
// corta a los 300. Pasado este tiempo no se empieza otra pestaña: queda para
// la próxima corrida, que la detecta por su huella.
const DEFAULT_TIME_BUDGET_MS = 100_000;

// Una pestaña son pocas decenas de consultas; el valor por defecto de Prisma
// (5 s) se queda corto con Neon recién despertado.
const SECTION_TX_TIMEOUT_MS = 60_000;

export interface SectionChanges {
  readonly document: ParsedDocument;
  /** Pestañas nuevas o con huella distinta, en el orden del documento. */
  readonly changed: readonly PreparedSection[];
  readonly unchanged: number;
}

export interface IngestionSummary {
  readonly sectionsProcessed: number;
  readonly unchanged: number;
  /** Pestañas cambiadas que no entraron en el tiempo de esta corrida. */
  readonly deferred: readonly string[];
  readonly topicsCreated: number;
  readonly itemsCreated: number;
  readonly occurrencesAdded: number;
  readonly occurrencesRemoved: number;
  readonly imagesCached: number;
}

export interface RunOptions {
  /** Tiempo tras el cual no se empieza otra pestaña. `Infinity` en local. */
  readonly timeBudgetMs?: number;
}

/**
 * Ingesta incremental: procesa solo las pestañas nuevas o modificadas.
 *
 * Es idempotente: una corrida sin cambios no llama al LLM ni escribe nada más
 * que el registro de la corrida, así que el cron puede dispararse de más o
 * perderse un día sin consecuencias.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly docs: GoogleDocsService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly prisma: PrismaService,
  ) {}

  /** Lee el documento y compara la huella de cada pestaña con la guardada. No escribe. */
  async findChanges(): Promise<SectionChanges> {
    const document = await this.docs.fetchDocument();
    const stored = new Map(
      (
        await this.prisma.section.findMany({
          where: { document: { googleDocId: document.documentId } },
          select: { tabId: true, contentHash: true },
        })
      ).map((section) => [section.tabId, section.contentHash]),
    );

    const changed: PreparedSection[] = [];
    for (const section of document.sections) {
      const prepared = await prepareSection(section, downloadImage);
      if (stored.get(section.tabId) !== prepared.contentHash) {
        changed.push(prepared);
      }
    }

    return { document, changed, unchanged: document.sections.length - changed.length };
  }

  /** Una corrida completa, con el candado de ingesta tomado. */
  run(options: RunOptions = {}): Promise<IngestionSummary> {
    const budget = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
    const startedAt = Date.now();

    return withIngestionRun(this.prisma, async () => {
      const { document, changed, unchanged } = await this.findChanges();
      const meta: DocumentMeta = {
        googleDocId: document.documentId,
        title: document.title,
        revisionId: document.revisionId,
      };

      const summary = {
        sectionsProcessed: 0,
        unchanged,
        deferred: [] as string[],
        topicsCreated: 0,
        itemsCreated: 0,
        occurrencesAdded: 0,
        occurrencesRemoved: 0,
        imagesCached: 0,
      };

      for (const prepared of changed) {
        const label = `[${prepared.section.position}] ${prepared.section.title}`;

        if (Date.now() - startedAt > budget) {
          summary.deferred.push(prepared.section.title);
          this.logger.log(`${label}: sin tiempo en esta corrida, queda para la próxima`);
          continue;
        }

        const written = await this.ingestSection(meta, prepared, label);
        summary.sectionsProcessed += 1;
        summary.topicsCreated += written.topics.created;
        summary.itemsCreated += written.items.created;
        summary.occurrencesAdded += written.occurrences;
        summary.occurrencesRemoved += written.occurrencesRemoved;
        summary.imagesCached += written.images;
      }

      this.logger.log(
        `Ingesta terminada: ${summary.sectionsProcessed} pestañas procesadas, ${unchanged} sin cambios, ` +
          `${summary.deferred.length} aplazadas, ${summary.itemsCreated} ítems nuevos`,
      );
      return summary;
    });
  }

  /**
   * Extrae una pestaña, asigna sus ítems nuevos al catálogo y la escribe en
   * su propia transacción: si la siguiente falla, esta queda hecha y la
   * próxima corrida ya no la ve como cambiada.
   */
  private async ingestSection(
    meta: DocumentMeta,
    prepared: PreparedSection,
    label: string,
  ): Promise<SectionWriteSummary> {
    const cached = new Map(
      (
        await this.prisma.imageAsset.findMany({ where: { hash: { in: [...prepared.imageHashes] } } })
      ).map((asset) => [asset.hash, asset.extractedText]),
    );

    const parts = await toLlmParts(prepared, cached, shrinkForLlm);
    this.logger.log(
      `${label}: extrayendo (${prepared.imageHashes.length - cached.size} imágenes nuevas, ${cached.size} de la caché)`,
    );

    // Una pestaña vacía no gasta una llamada.
    const extraction: Extraction =
      parts.length === 0 ? { items: [], imageTexts: [] } : await this.llm.extractStudyItems(parts);
    const imageTexts = new Map(extraction.imageTexts.map((image) => [image.imageId, image.text]));
    const items = uniqueItems(extraction.items);

    const existing =
      items.length === 0
        ? []
        : await this.prisma.studyItem.findMany({
            where: { japanese: { in: [...new Set(items.map((item) => item.japanese))] } },
            select: { type: true, japanese: true },
          });
    const existingKeys = new Set(existing.map((item) => itemKey(item.type, item.japanese)));
    const newItems = items.filter((item) => !existingKeys.has(itemKey(item.type, item.japanese)));

    const topics = await this.prisma.topic.findMany({
      select: { id: true, slug: true, name: true, category: true, position: true, parent: { select: { slug: true } } },
    });
    const catalog: CatalogEntry[] = topics.map((topic) => ({
      slug: topic.slug,
      name: topic.name,
      category: topic.category,
      position: topic.position,
      parentSlug: topic.parent?.slug ?? null,
    }));

    let assignment: TopicAssignment = { assignments: [], newTopics: [] };
    if (newItems.length > 0) {
      this.logger.log(`${label}: asignando ${newItems.length} ítems nuevos a temas`);
      assignment = await this.llm.assignToTopics(
        toItemsToAssign(newItems),
        catalog.map(({ position: _position, ...topic }) => topic),
      );
    }

    const slugById = new Map(topics.map((topic) => [topic.id, topic.slug]));
    const maxPositions = await this.prisma.itemTopic.groupBy({ by: ['topicId'], _max: { position: true } });
    const nextItemPosition = new Map(
      maxPositions.flatMap((row) => {
        const slug = slugById.get(row.topicId);
        return slug === undefined ? [] : [[slug, (row._max.position ?? -1) + 1] as const];
      }),
    );

    const plan = buildSectionPlan({
      section: {
        tabId: prepared.section.tabId,
        title: prepared.section.title,
        position: prepared.section.position,
        contentHash: prepared.contentHash,
        rawText: prepared.section.rawText,
      },
      items,
      existingKeys,
      assignment,
      catalog,
      nextItemPosition,
      images: prepared.imageHashes.map((hash) => ({
        hash,
        text: cached.get(hash) ?? imageTexts.get(hash) ?? '',
      })),
    });

    const written = await this.prisma.$transaction((tx) => writeSectionPlan(tx, meta, plan), {
      timeout: SECTION_TX_TIMEOUT_MS,
      maxWait: 30_000,
    });

    this.logger.log(
      `${label}: ${items.length} ítems (${written.items.created} nuevos), ${written.topics.created} temas nuevos`,
    );
    return written;
  }
}
