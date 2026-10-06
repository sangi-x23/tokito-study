import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carga apps/api/.env si existe.
 *
 * En Vercel las variables las inyecta la plataforma y el archivo no existe,
 * por eso la carga es opcional. `process.loadEnvFile` nunca pisa una variable
 * ya presente en el entorno, así que la plataforma siempre gana.
 *
 * Vive separado de `env.ts` porque `prisma.config.ts` necesita cargar el
 * archivo sin disparar la validación: `prisma generate` debe funcionar en un
 * clon recién hecho, antes de que exista el .env.
 */
export function loadEnvFile(): void {
  const path = resolve(process.cwd(), '.env');

  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
