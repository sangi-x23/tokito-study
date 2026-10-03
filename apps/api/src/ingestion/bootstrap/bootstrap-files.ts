import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { extractionSchema, taxonomySchema, type Taxonomy } from '../../llm';
import type { SectionExtraction } from '../types/import-plan';
import type { DocumentMeta } from '../helpers/write-plan';

/**
 * Archivos locales del bootstrap, en `apps/api/.bootstrap/` (ignorado por git:
 * es contenido del documento).
 *
 * Al leerlos se validan con zod como cualquier entrada externa: el de la
 * taxonomía lo edita el autor a mano, y los demás pueden quedar de una versión
 * anterior del código.
 */
export const BOOTSTRAP_DIR = resolve(__dirname, '../../../.bootstrap');
const EXTRACTIONS_DIR = join(BOOTSTRAP_DIR, 'extractions');
export const TAXONOMY_FILE = join(BOOTSTRAP_DIR, 'taxonomy.json');
const DOCUMENT_FILE = join(BOOTSTRAP_DIR, 'document.json');

const FILE_VERSION = 1;

const extractionFileSchema = z.object({
  version: z.literal(FILE_VERSION),
  tabId: z.string(),
  title: z.string(),
  position: z.int(),
  contentHash: z.string(),
  rawText: z.string(),
  extractedAt: z.string(),
  items: extractionSchema.shape.items,
  images: z.array(z.object({ hash: z.string(), text: z.string() })),
});

const documentFileSchema = z.object({
  googleDocId: z.string(),
  title: z.string(),
  revisionId: z.string().nullable(),
});

// En Windows un `:` no es válido en un nombre de archivo; los tabId son
// `t.xxxx`, pero no cuesta nada protegerse.
const fileForTab = (tabId: string): string => join(EXTRACTIONS_DIR, `${tabId.replace(/[^\w.-]/g, '_')}.json`);

async function readJson<T>(path: string, schema: z.ZodType<T>, what: string): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    throw new Error(`No existe ${path}. ${what}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${path} no es JSON válido: ${error instanceof Error ? error.message : String(error)}`);
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`${path} no tiene el formato esperado:\n${issues.join('\n')}`);
  }
  return result.data;
}

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

/** La extracción guardada de una pestaña, o null si no hay o es de otro formato. */
export async function readExtraction(tabId: string): Promise<SectionExtraction | null> {
  try {
    return await readJson(fileForTab(tabId), extractionFileSchema, '');
  } catch {
    return null;
  }
}

export async function writeExtraction(extraction: SectionExtraction): Promise<void> {
  await writeJson(fileForTab(extraction.tabId), {
    version: FILE_VERSION,
    ...extraction,
    extractedAt: new Date().toISOString(),
  });
}

/** Borra las extracciones de pestañas que ya no están en el documento (o se excluyeron). */
export async function pruneExtractions(keepTabIds: readonly string[]): Promise<string[]> {
  const keep = new Set(keepTabIds.map(fileForTab));
  const files = await readdir(EXTRACTIONS_DIR).catch(() => []);
  const removed = files.map((file) => join(EXTRACTIONS_DIR, file)).filter((path) => !keep.has(path));

  await Promise.all(removed.map((path) => rm(path)));
  return removed;
}

export async function readAllExtractions(): Promise<SectionExtraction[]> {
  const files = (await readdir(EXTRACTIONS_DIR).catch(() => [])).filter((file) => file.endsWith('.json'));
  if (files.length === 0) {
    throw new Error(`No hay extracciones en ${EXTRACTIONS_DIR}. Corre primero la fase "extract".`);
  }

  return Promise.all(
    files.map((file) => readJson(join(EXTRACTIONS_DIR, file), extractionFileSchema, '')),
  );
}

export const writeDocumentMeta = (meta: DocumentMeta): Promise<void> => writeJson(DOCUMENT_FILE, meta);

export const readDocumentMeta = (): Promise<DocumentMeta> =>
  readJson(DOCUMENT_FILE, documentFileSchema, 'Corre primero la fase "extract".');

export const writeTaxonomy = (taxonomy: Taxonomy): Promise<void> => writeJson(TAXONOMY_FILE, taxonomy);

export const readTaxonomy = (): Promise<Taxonomy> =>
  readJson(TAXONOMY_FILE, taxonomySchema, 'Corre primero la fase "taxonomy".');
