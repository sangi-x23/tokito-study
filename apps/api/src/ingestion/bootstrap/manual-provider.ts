import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import {
  checkExtraction,
  checkTaxonomy,
  EXTRACTION_INSTRUCTIONS,
  extractionSchema,
  imageMarker,
  parseStructured,
  TAXONOMY_INSTRUCTIONS,
  taxonomySchema,
  taxonomyUserMessage,
  type Extraction,
  type LabelWithExamples,
  type LlmPart,
  type LlmProvider,
  type Taxonomy,
  type TopicAssignment,
} from '../../llm/index.js';
import { sha256 } from '../helpers/content-hash.js';
import { BOOTSTRAP_DIR } from './bootstrap-files.js';

export const MANUAL_DIR = join(BOOTSTRAP_DIR, 'manual');
const RESPONSE_FILE = 'response.json';

/**
 * La solicitud quedó escrita y todavía no tiene respuesta. El bootstrap la
 * cuenta como pendiente y sigue con la pestaña siguiente.
 */
export class LlmPendingError extends Error {
  constructor(readonly requestDir: string) {
    super(`Solicitud pendiente: falta ${join(requestDir, RESPONSE_FILE)}`);
    this.name = 'LlmPendingError';
  }
}

/**
 * `LlmProvider` sobre archivos, para hacer el bootstrap sin API: cada llamada
 * deja una solicitud en `.bootstrap/manual/<operación>-<clave>/` (instrucciones,
 * contenido y esquema, más las imágenes) y alguien escribe a mano su
 * `response.json`. Al volver a correr, la respuesta se valida con el mismo
 * esquema y las mismas reglas `check*` que una respuesta de Gemini.
 *
 * La clave es el hash del contenido, así que una pestaña que cambió genera
 * una solicitud nueva en vez de reutilizar una respuesta vieja.
 *
 * Solo sirve para el bootstrap: la ingesta semanal sigue con Gemini.
 */
export class ManualProvider implements LlmProvider {
  constructor(private readonly dir: string = MANUAL_DIR) {}

  async extractStudyItems(parts: readonly LlmPart[]): Promise<Extraction> {
    const imageIds = parts.flatMap((part) => (part.kind === 'image' ? [part.imageId] : []));
    const key = sha256(
      JSON.stringify(parts.map((part) => (part.kind === 'text' ? `t:${part.text}` : `i:${part.imageId}`))),
    );

    const content = parts
      .map((part) =>
        part.kind === 'text' ? part.text : `${imageMarker(part.imageId)} → ${part.imageId}.jpg`,
      )
      .join('\n');

    return this.exchange(
      'extractStudyItems',
      `extract-${key.slice(0, 16)}`,
      extractionSchema,
      EXTRACTION_INSTRUCTIONS,
      content,
      parts.flatMap((part) => (part.kind === 'image' ? [{ name: `${part.imageId}.jpg`, data: part.data }] : [])),
      (result) => checkExtraction(result, imageIds),
    );
  }

  async buildTaxonomy(labels: readonly LabelWithExamples[]): Promise<Taxonomy> {
    const key = sha256(JSON.stringify(labels));

    return this.exchange(
      'buildTaxonomy',
      `taxonomy-${key.slice(0, 16)}`,
      taxonomySchema,
      TAXONOMY_INSTRUCTIONS,
      taxonomyUserMessage(labels),
      [],
      (result) => checkTaxonomy(result, labels),
    );
  }

  assignToTopics(): Promise<TopicAssignment> {
    return Promise.reject(new Error('ManualProvider solo cubre el bootstrap; la asignación es de la ingesta semanal.'));
  }

  private async exchange<Schema extends z.ZodType>(
    operation: string,
    name: string,
    schema: Schema,
    instructions: string,
    content: string,
    files: readonly { name: string; data: Buffer }[],
    checks: (value: z.infer<Schema>) => string[],
  ): Promise<z.infer<Schema>> {
    const requestDir = join(this.dir, name);
    const response = await readFile(join(requestDir, RESPONSE_FILE), 'utf8').catch(() => null);

    if (response !== null) {
      return parseStructured(operation, schema, { text: response, finishReason: undefined }, checks);
    }

    await mkdir(requestDir, { recursive: true });
    await Promise.all(files.map((file) => writeFile(join(requestDir, file.name), file.data)));
    await writeFile(join(requestDir, 'request.md'), requestDocument(instructions, content, schema), 'utf8');

    throw new LlmPendingError(requestDir);
  }
}

function requestDocument(instructions: string, content: string, schema: z.ZodType): string {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema);

  return [
    '# Instrucciones',
    instructions,
    `# Formato de la respuesta (${RESPONSE_FILE})`,
    '```json',
    JSON.stringify(jsonSchema, null, 2),
    '```',
    '# Contenido',
    content,
    '',
  ].join('\n\n');
}
