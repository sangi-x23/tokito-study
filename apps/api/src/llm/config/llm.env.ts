import { z } from 'zod';
import { parseEnvWith } from '../../config/env';

const llmEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),

  /**
   * Modelo Flash del nivel gratuito. Acepta también el nombre con el prefijo
   * `models/`, que es como lo devuelve el listado de la API.
   */
  GEMINI_MODEL: z
    .string()
    .transform((value) => value.replace(/^models\//, ''))
    .refine((model) => /^gemini-[\w.-]+$/.test(model), {
      message: 'no parece un modelo de Gemini (ej. gemini-3.5-flash)',
    }),

  /**
   * Separación mínima entre el inicio de dos llamadas. Los límites del nivel
   * gratuito no son fijos ni públicos, así que el valor por defecto es
   * conservador (unas 8 llamadas por minuto) y se ajusta por entorno.
   */
  GEMINI_MIN_INTERVAL_MS: z.coerce.number().int().min(0).default(7000),

  /** Reintentos ante 429 por minuto y errores transitorios del servidor. */
  GEMINI_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(4),
});

export type LlmEnv = z.infer<typeof llmEnvSchema>;

/**
 * Se valida al construir el proveedor, no al importar el módulo: la API
 * pública no llama al LLM y tiene que arrancar sin la clave de Gemini.
 */
export function loadLlmEnv(source: NodeJS.ProcessEnv = process.env): LlmEnv {
  return parseEnvWith(llmEnvSchema, source);
}
