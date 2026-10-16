import { z } from 'zod';
import { buildTranslationRequest, currentExamples, mergeTranslation } from '../vocabulary/helpers/translations.js';
import {
  downloadVocabularySources,
  readBatches,
  readTatoebaSpanish,
  readTranslations,
  REQUESTS_DIR,
  RESPONSES_DIR,
  writeRequestBatches,
  writeTranslations,
} from '../vocabulary/helpers/vocabulary-files.js';
import { translationResponseSchema, type Translation } from '../vocabulary/schemas/translation.schema.js';
import type { VocabularySource } from '../vocabulary/types/vocabulary.js';

/**
 * Traduce al español el vocabulario, en dos pasos que se corren por separado:
 *
 *   pnpm --filter @tokito/api vocab:translate requests [--size 200]
 *   (responder cada lote de .vocabulary/requests/ en .vocabulary/responses/,
 *    con el mismo nombre)
 *   pnpm --filter @tokito/api vocab:translate merge
 *
 * `requests` solo pide las palabras sin traducción o con una vieja (su inglés
 * cambió en JMdict). `merge` valida las respuestas y las suma a
 * `apps/api/data/vocabulary/`, que va al repo.
 *
 * Las traducciones humanas de Tatoeba se leen de dos exportaciones que hay
 * que bajar y descomprimir antes en `apps/api/.vocabulary/tatoeba/`:
 *
 *   https://downloads.tatoeba.org/exports/per_language/jpn/jpn-spa_links.tsv.bz2
 *   https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences.tsv.bz2
 */
const USAGE = 'Uso: vocab:translate <requests|merge> [--size <palabras por lote>]';

/** Si la traducción guardada salió del inglés que JMdict trae hoy. */
const isCurrent = (source: VocabularySource, translation: Translation | undefined): boolean =>
  translation !== undefined && currentExamples(source, translation) !== null;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args.find((arg) => !arg.startsWith('-'));
  const sizeArg = args.indexOf('--size');
  const size = sizeArg >= 0 ? Number(args[sizeArg + 1]) : 200;
  if ((command !== 'requests' && command !== 'merge') || !Number.isInteger(size) || size < 1) {
    throw new Error(USAGE);
  }

  const sources = await downloadVocabularySources();
  const spanish = await readTatoebaSpanish();
  const translations = await readTranslations();
  const pending = sources.filter((source) => !isCurrent(source, translations.get(source.key)));

  if (command === 'requests') {
    const batches = await writeRequestBatches(
      pending.map((source) => buildTranslationRequest(source, spanish)),
      size,
    );
    console.log(`${sources.length} palabras, ${pending.length} por traducir en ${batches} lotes en ${REQUESTS_DIR}.`);
    return;
  }

  // Toda respuesta pisa la traducción guardada, aunque ya estuviera al día:
  // así se puede corregir un lote y volver a fusionarlo.
  const bySource = new Map(sources.map((source) => [source.key, source]));
  const problems: string[] = [];
  let merged = 0;
  for (const [name, json] of await readBatches(RESPONSES_DIR)) {
    const result = translationResponseSchema.safeParse(json);
    if (!result.success) {
      problems.push(`${name}:\n${z.prettifyError(result.error)}`);
      continue;
    }
    for (const response of result.data) {
      const source = bySource.get(response.key);
      if (!source) {
        problems.push(`${name}: ${response.key} no es una palabra de las listas`);
        continue;
      }
      try {
        translations.set(response.key, mergeTranslation(source, buildTranslationRequest(source, spanish), response));
        merged++;
      } catch (error) {
        problems.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await writeTranslations(sources, translations);
  const missing = sources.filter((source) => !isCurrent(source, translations.get(source.key)));
  console.log(`${merged} traducciones fusionadas; faltan ${missing.length} de ${sources.length}.`);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
