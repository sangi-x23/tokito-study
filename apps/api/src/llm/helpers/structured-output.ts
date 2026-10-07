import type { z } from 'zod';
import { LlmValidationError } from '../llm.errors.js';
import type { ModelOutput } from '../types/structured-output.js';

/**
 * Convierte la salida del modelo en un valor validado o lanza
 * `LlmValidationError`.
 *
 * `checks` son las reglas que zod no puede ver solo con la respuesta (que cada
 * imagen enviada tenga su texto, que cada etiqueta tenga tema…).
 */
export function parseStructured<Schema extends z.ZodType>(
  operation: string,
  schema: Schema,
  output: ModelOutput,
  checks: (value: z.infer<Schema>) => string[] = () => [],
): z.infer<Schema> {
  if (!output.text) {
    throw new LlmValidationError(operation, [
      `respuesta vacía (finishReason: ${output.finishReason ?? 'desconocido'})`,
    ]);
  }

  let json: unknown;
  try {
    json = JSON.parse(output.text);
  } catch {
    // Con MAX_TOKENS el JSON llega cortado: decirlo ahorra adivinar.
    throw new LlmValidationError(operation, [
      `no es JSON válido (finishReason: ${output.finishReason ?? 'desconocido'})`,
    ]);
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new LlmValidationError(
      operation,
      result.error.issues.map((issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`),
    );
  }

  const issues = checks(result.data);
  if (issues.length > 0) {
    throw new LlmValidationError(operation, issues);
  }

  return result.data;
}
