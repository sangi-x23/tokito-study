import { access } from 'node:fs/promises';
import { Logger } from '@nestjs/common';
import { checkTaxonomy, type Extraction, type Taxonomy } from '../../llm';
import { downloadImage, shrinkForLlm } from '../helpers/images';
import { buildImportPlan } from '../helpers/import-plan';
import { withIngestionRun } from '../helpers/ingestion-run';
import { collectLabels } from '../helpers/labels';
import { prepareSection, toLlmParts } from '../helpers/prepare-section';
import { writePlan } from '../helpers/write-plan';
import type { BootstrapDeps } from '../types/bootstrap';
import type { SectionExtraction } from '../types/import-plan';
import type { WriteSummary } from '../types/write-plan';
import {
  pruneExtractions,
  readAllExtractions,
  readDocumentMeta,
  readExtraction,
  readTaxonomy,
  TAXONOMY_FILE,
  writeDocumentMeta,
  writeExtraction,
  writeTaxonomy,
} from './bootstrap-files';
import { LlmPendingError } from './manual-provider';

const logger = new Logger('Bootstrap');

// El import entero va en una transacción. Por lotes son unas decenas de
// consultas, pero un re-import que mueve muchos ítems de tema actualiza fila
// por fila: el valor por defecto de Prisma (5 s) no alcanza.
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Fase 1: extrae los ítems de cada pestaña y los guarda en un JSON por
 * pestaña. Es reanudable: salta las pestañas cuya extracción guardada tiene la
 * misma huella de contenido, así que si se corta a la mitad (cuota, red) se
 * vuelve a correr y sigue donde iba.
 *
 * La base solo se lee, para reutilizar el texto de imágenes ya procesadas.
 */
export async function extractPhase(deps: BootstrapDeps, options: { force: boolean }): Promise<void> {
  const document = await deps.docs.fetchDocument();
  await writeDocumentMeta({
    googleDocId: document.documentId,
    title: document.title,
    revisionId: document.revisionId,
  });

  const removed = await pruneExtractions(document.sections.map((section) => section.tabId));
  removed.forEach((path) => logger.log(`Borrada la extracción de una pestaña que ya no está: ${path}`));

  let extracted = 0;
  let pending = 0;

  for (const section of document.sections) {
    const label = `[${section.position}] ${section.title}`;
    const prepared = await prepareSection(section, downloadImage);
    const saved = await readExtraction(section.tabId);

    if (!options.force && saved?.contentHash === prepared.contentHash) {
      logger.log(`${label}: sin cambios, se salta`);
      continue;
    }

    const cached = new Map(
      (
        await deps.prisma.imageAsset.findMany({ where: { hash: { in: [...prepared.imageHashes] } } })
      ).map((asset) => [asset.hash, asset.extractedText]),
    );

    const parts = await toLlmParts(prepared, cached, shrinkForLlm);
    const newImages = prepared.imageHashes.length - cached.size;
    logger.log(`${label}: extrayendo (${newImages} imágenes nuevas, ${cached.size} de la caché)`);

    // Una pestaña vacía no gasta una llamada.
    let result: Extraction;
    try {
      result = parts.length === 0 ? { items: [], imageTexts: [] } : await deps.llm.extractStudyItems(parts);
    } catch (error) {
      // Con el proveedor manual la respuesta llega en otra corrida.
      if (!(error instanceof LlmPendingError)) throw error;
      logger.log(`${label}: pendiente, falta la respuesta en ${error.requestDir}`);
      pending += 1;
      continue;
    }
    const imageTexts = new Map(result.imageTexts.map((image) => [image.imageId, image.text]));

    const extraction: SectionExtraction = {
      tabId: section.tabId,
      title: section.title,
      position: section.position,
      contentHash: prepared.contentHash,
      rawText: section.rawText,
      items: result.items,
      images: prepared.imageHashes.map((hash) => ({
        hash,
        text: cached.get(hash) ?? imageTexts.get(hash) ?? '',
      })),
    };

    await writeExtraction(extraction);
    extracted += 1;
    logger.log(`${label}: ${result.items.length} ítems`);
  }

  const unchanged = document.sections.length - extracted - pending;
  logger.log(
    `Extracción terminada: ${extracted} pestañas extraídas, ${unchanged} sin cambios` +
      (pending > 0 ? `, ${pending} pendientes.` : '.'),
  );
}

/**
 * Fase 2: arma la taxonomía con las etiquetas de todas las extracciones y la
 * guarda para que el autor la revise. No pisa una taxonomía ya revisada salvo
 * que se pida con `force`.
 */
export async function taxonomyPhase(deps: Pick<BootstrapDeps, 'llm'>, options: { force: boolean }): Promise<void> {
  const exists = await access(TAXONOMY_FILE).then(
    () => true,
    () => false,
  );
  if (exists && !options.force) {
    throw new Error(
      `Ya existe ${TAXONOMY_FILE} y puede tener cambios tuyos. Bórralo o usa --force para regenerarlo.`,
    );
  }

  const labels = collectLabels(await readAllExtractions());
  logger.log(`Armando la taxonomía con ${labels.length} etiquetas`);

  const taxonomy = await deps.llm.buildTaxonomy(labels);
  await writeTaxonomy(taxonomy);

  console.log(`\n${formatTaxonomy(taxonomy)}\n`);
  logger.log(`Taxonomía guardada en ${TAXONOMY_FILE}. Revísala y luego corre la fase "import".`);
}

/**
 * Fase 3: valida la taxonomía revisada y escribe todo en la base, en una sola
 * transacción y con el candado de ingesta tomado. Con `dryRun` solo arma el
 * plan y cuenta lo que escribiría.
 */
export async function importPhase(
  deps: Pick<BootstrapDeps, 'prisma'>,
  options: { dryRun: boolean },
): Promise<void> {
  const extractions = await readAllExtractions();
  const taxonomy = await readTaxonomy();
  const document = await readDocumentMeta();

  // La misma validación que se le hizo al LLM: la edición a mano también
  // puede dejar una etiqueta sin tema o un padre que no existe.
  const issues = checkTaxonomy(taxonomy, collectLabels(extractions));
  if (issues.length > 0) {
    throw new Error(`La taxonomía revisada no es válida:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
  }

  const plan = buildImportPlan(extractions, taxonomy);
  logger.log(
    `Plan: ${plan.sections.length} pestañas, ${plan.topics.length} temas, ${plan.items.length} ítems, ${plan.images.length} imágenes`,
  );

  if (options.dryRun) {
    logger.log('Dry run: no se escribió nada.');
    return;
  }

  const summary = await withIngestionRun(deps.prisma, async () => {
    const written = await deps.prisma.$transaction((tx) => writePlan(tx, document, plan), {
      timeout: IMPORT_TIMEOUT_MS,
      maxWait: 30_000,
    });
    return { ...written, sectionsProcessed: written.sections };
  });

  logger.log(formatSummary(summary));
}

function formatTaxonomy(taxonomy: Taxonomy): string {
  const lines: string[] = [];
  const labelsFor = (slug: string) =>
    taxonomy.labelMap.filter((entry) => entry.topicSlug === slug).map((entry) => entry.label);

  const describe = (slug: string, name: string, category: string) => {
    const labels = labelsFor(slug);
    return `${name} (${slug}, ${category})${labels.length > 0 ? `  ← ${labels.join(', ')}` : ''}`;
  };

  for (const root of taxonomy.topics.filter((topic) => topic.parentSlug === null)) {
    lines.push(describe(root.slug, root.name, root.category));
    for (const child of taxonomy.topics.filter((topic) => topic.parentSlug === root.slug)) {
      lines.push(`  └ ${describe(child.slug, child.name, child.category)}`);
    }
  }

  return lines.join('\n');
}

function formatSummary(summary: WriteSummary): string {
  return [
    'Importación terminada:',
    `  pestañas: ${summary.sections}`,
    `  temas: ${summary.topics.created} nuevos, ${summary.topics.updated} actualizados`,
    `  ítems: ${summary.items.created} nuevos, ${summary.items.updated} actualizados`,
    `  ítem↔tema: ${summary.itemTopics.created} nuevos, ${summary.itemTopics.updated} actualizados, ${summary.itemTopics.removed} quitados`,
    `  apariciones nuevas: ${summary.occurrences}`,
    `  imágenes nuevas en caché: ${summary.images}`,
  ].join('\n');
}
