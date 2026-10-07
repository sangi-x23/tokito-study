import { z } from 'zod';
import { parseEnvWith } from '../../config/env.js';

const ingestionEnvSchema = z.object({
  /**
   * Protege el endpoint de ingesta: `Authorization: Bearer <CRON_SECRET>`.
   * Vercel Cron lo manda solo si la variable existe en el proyecto.
   */
  CRON_SECRET: z.string().min(16, { message: 'debe tener al menos 16 caracteres' }),
});

export type IngestionEnv = z.infer<typeof ingestionEnvSchema>;

/**
 * Se valida al recibir una petición de ingesta, no al importar el módulo: la
 * API pública de solo lectura arranca aunque el secreto no esté configurado.
 */
export function loadIngestionEnv(source: NodeJS.ProcessEnv = process.env): IngestionEnv {
  return parseEnvWith(ingestionEnvSchema, source);
}
