import { Logger } from '@nestjs/common';
import { GoogleGenAI, type GenerateContentParameters, type Part } from '@google/genai';
import { z } from 'zod';
import { loadLlmEnv } from '../config/llm.env';
import { withRetry } from '../helpers/retry';
import { parseStructured } from '../helpers/structured-output';
import { Throttle } from '../helpers/throttle';
import { ASSIGNMENT_INSTRUCTIONS, assignmentUserMessage } from '../prompts/assignment.prompt';
import { EXTRACTION_INSTRUCTIONS, imageMarker } from '../prompts/extraction.prompt';
import { TAXONOMY_INSTRUCTIONS, taxonomyUserMessage } from '../prompts/taxonomy.prompt';
import { assignmentSchema, checkAssignment } from '../schemas/assignment.schema';
import { checkExtraction, extractionSchema } from '../schemas/extraction.schema';
import { checkTaxonomy, taxonomySchema } from '../schemas/taxonomy.schema';
import type { GeminiDeps, GeminiSettings, GenerateFn } from '../types/gemini';
import type {
  CatalogTopic,
  Extraction,
  ItemToAssign,
  LabelWithExamples,
  LlmPart,
  LlmProvider,
  Taxonomy,
  TopicAssignment,
} from '../types/llm-provider';

// Una pestaña con varias imágenes tarda bastante más que una llamada de texto,
// pero tiene que caber holgada en los 300 s de una función de Vercel.
const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Convierte las partes de una pestaña en partes de Gemini, con cada imagen
 * precedida de su marca para que el modelo pueda devolver su texto.
 */
export function toGeminiParts(parts: readonly LlmPart[]): Part[] {
  return parts.flatMap((part): Part[] =>
    part.kind === 'text'
      ? [{ text: part.text }]
      : [
          { text: imageMarker(part.imageId) },
          { inlineData: { mimeType: part.mimeType, data: part.data.toString('base64') } },
        ],
  );
}

/**
 * El JSON Schema que se manda a Gemini sale del mismo esquema zod que valida
 * la respuesta, así que no pueden desincronizarse.
 */
function responseJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema);
  return jsonSchema;
}

/**
 * Implementación de `LlmProvider` con Gemini.
 *
 * Todo es perezoso: la clave y el modelo se validan en la primera llamada, no
 * al construir el proveedor, para que la API pública arranque sin ellos.
 */
export class GeminiProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private runtime: { generate: GenerateFn; settings: GeminiSettings; throttle: Throttle } | undefined;

  constructor(private readonly deps: GeminiDeps = {}) {}

  async extractStudyItems(parts: readonly LlmPart[]): Promise<Extraction> {
    const imageIds = parts.flatMap((part) => (part.kind === 'image' ? [part.imageId] : []));

    return this.generate(
      'extractStudyItems',
      extractionSchema,
      EXTRACTION_INSTRUCTIONS,
      toGeminiParts(parts),
      (result) => checkExtraction(result, imageIds),
    );
  }

  async buildTaxonomy(labels: readonly LabelWithExamples[]): Promise<Taxonomy> {
    return this.generate(
      'buildTaxonomy',
      taxonomySchema,
      TAXONOMY_INSTRUCTIONS,
      [{ text: taxonomyUserMessage(labels) }],
      (result) => checkTaxonomy(result, labels),
    );
  }

  async assignToTopics(
    items: readonly ItemToAssign[],
    catalog: readonly CatalogTopic[],
  ): Promise<TopicAssignment> {
    return this.generate(
      'assignToTopics',
      assignmentSchema,
      ASSIGNMENT_INSTRUCTIONS,
      [{ text: assignmentUserMessage(items, catalog) }],
      (result) => checkAssignment(result, items, catalog),
    );
  }

  private async generate<Schema extends z.ZodType>(
    operation: string,
    schema: Schema,
    systemInstruction: string,
    parts: Part[],
    checks: (value: z.infer<Schema>) => string[],
  ): Promise<z.infer<Schema>> {
    const { generate, settings, throttle } = this.getRuntime();
    const params: GenerateContentParameters = {
      model: settings.model,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseJsonSchema: responseJsonSchema(schema),
      },
    };

    const started = Date.now();
    const response = await withRetry(() => throttle.schedule(() => generate(params)), {
      maxRetries: settings.maxRetries,
      ...(this.deps.clock ? { clock: this.deps.clock } : {}),
      ...(this.deps.random ? { random: this.deps.random } : {}),
      onRetry: (attempt, delayMs, error) =>
        this.logger.warn(
          `${operation}: reintento ${attempt}/${settings.maxRetries} en ${delayMs} ms (${error instanceof Error ? error.message.slice(0, 200) : String(error)})`,
        ),
    });

    this.logger.log(
      `${operation}: ${Date.now() - started} ms, ${response.usageMetadata?.totalTokenCount ?? '?'} tokens`,
    );

    return parseStructured(
      operation,
      schema,
      { text: response.text, finishReason: response.candidates?.[0]?.finishReason },
      checks,
    );
  }

  private getRuntime(): { generate: GenerateFn; settings: GeminiSettings; throttle: Throttle } {
    if (!this.runtime) {
      const settings = this.deps.settings ?? settingsFromEnv();
      const generate = this.deps.generate ?? createGenerate();

      this.runtime = {
        generate,
        settings,
        throttle: new Throttle(settings.minIntervalMs, this.deps.clock),
      };
    }

    return this.runtime;
  }
}

function settingsFromEnv(): GeminiSettings {
  const env = loadLlmEnv();
  return {
    model: env.GEMINI_MODEL,
    minIntervalMs: env.GEMINI_MIN_INTERVAL_MS,
    maxRetries: env.GEMINI_MAX_RETRIES,
  };
}

// Sin `retryOptions` el SDK no reintenta: los reintentos son nuestros, porque
// tienen que distinguir la cuota por minuto de la diaria.
function createGenerate(): GenerateFn {
  const client = new GoogleGenAI({
    apiKey: loadLlmEnv().GEMINI_API_KEY,
    httpOptions: { timeout: REQUEST_TIMEOUT_MS },
  });

  return (params) => client.models.generateContent(params);
}
