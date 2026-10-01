import { z } from 'zod';
import { parseEnvWith } from '../../config/env';

/** Lo que necesitamos del JSON de la cuenta de servicio. Trae más campos. */
const serviceAccountSchema = z.object({
  client_email: z.email(),
  private_key: z.string().startsWith('-----BEGIN', {
    message: 'no parece una clave privada PEM',
  }),
});

// Acepta tanto el ID pelado como la URL completa del documento, que es lo que
// uno copia de la barra del navegador.
const DOCUMENT_URL = /\/document\/d\/([\w-]+)/;

const googleEnvSchema = z.object({
  /**
   * El JSON de la cuenta de servicio, codificado en base64.
   *
   * Va en una sola variable y en base64 porque la clave privada trae saltos de
   * línea reales: repartida en varias variables con `\n` escapados se rompe al
   * copiarla entre el .env local y el panel de Vercel.
   */
  GOOGLE_SERVICE_ACCOUNT_KEY: z
    .string()
    .min(1)
    .transform((value, ctx) => {
      try {
        return JSON.parse(Buffer.from(value, 'base64').toString('utf8')) as unknown;
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'debe ser el JSON de la cuenta de servicio codificado en base64',
        });
        return z.NEVER;
      }
    })
    .pipe(serviceAccountSchema),

  /** El ID del documento nunca va en el código ni en el repo. */
  GOOGLE_DOC_ID: z
    .string()
    .min(1)
    .transform((value) => DOCUMENT_URL.exec(value)?.[1] ?? value)
    .refine((id) => /^[\w-]{20,}$/.test(id), {
      message: 'no parece un ID de Google Doc ni una URL que lo contenga',
    }),
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
