import { z } from 'zod';
import { parseEnvWith } from '../config/env';

const googleEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REFRESH_TOKEN: z.string().min(1),
  // El ID del documento nunca va en el código ni en el repo.
  GOOGLE_DOC_ID: z.string().min(1),
});

export type GoogleEnv = z.infer<typeof googleEnvSchema>;

/**
 * Se valida al construir el cliente, no al importar el módulo.
 *
 * La API pública de solo lectura no toca Google Docs: solo lo hacen el
 * bootstrap y el endpoint de ingesta. Validar aquí evita que falte una
 * credencial de Google e impida arrancar un servidor que no la necesita.
 */
export function loadGoogleEnv(source: NodeJS.ProcessEnv = process.env): GoogleEnv {
  return parseEnvWith(googleEnvSchema, source);
}
