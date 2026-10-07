import { GoogleDocsService, type DocumentPart } from '../google-docs/index.js';
import { downloadImage } from '../ingestion/helpers/images.js';
import { GeminiProvider, type LlmPart } from '../llm/index.js';

/**
 * Extrae los ítems de una pestaña real e imprime el JSON, para calibrar el
 * prompt de extracción.
 *
 *   pnpm --filter @tokito/api llm:try -- <tabId>
 *
 * Gasta una llamada de la cuota gratuita por ejecución (más los reintentos).
 * Manda las imágenes tal cual: reducirlas con `sharp` y consultar la caché de
 * `ImageAsset` es trabajo de la ingesta.
 */
async function toLlmPart(part: DocumentPart): Promise<LlmPart> {
  if (part.kind === 'text') {
    return part;
  }

  const image = await downloadImage(part.contentUri);
  return { kind: 'image', imageId: part.objectId, mimeType: image.mimeType, data: image.data };
}

async function main(): Promise<void> {
  const tabId = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
  const parsed = await new GoogleDocsService().fetchDocument();
  const section = parsed.sections.find((candidate) => candidate.tabId === tabId);

  if (!section) {
    const available = parsed.sections.map((candidate) => `  ${candidate.tabId}  ${candidate.title}`);
    throw new Error(`Indica un tabId válido. Disponibles:\n${available.join('\n')}`);
  }

  const parts = await Promise.all(section.parts.map(toLlmPart));
  const extraction = await new GeminiProvider().extractStudyItems(parts);

  console.log(JSON.stringify({ tabId: section.tabId, title: section.title, ...extraction }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
