import { z } from 'zod';
import { loadEnvFile } from './load-env-file';

loadEnvFile();

/**
 * Un .env recién copiado de la plantilla trae todas las claves vacías. Tratar
 * el string vacío como ausente evita dos cosas: que PORT= se lea como 0 y
 * falle .positive(), y que el error diga "formato inválido" cuando lo que pasa
 * en realidad es que falta el valor.
 */
function emptyAsUndefined(source: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === '' ? undefined : value]),
  );
}

/**
 * Valida un trozo del entorno y falla con un mensaje que nombra cada variable.
 *
 * Cada componente declara y valida solo las variables que lee, en vez de haber
 * un esquema único con todo: así la API pública arranca sin las credenciales de
 * Google ni de Gemini, que solo necesita la ingesta.
 */
export function parseEnvWith<Schema extends z.ZodType>(
  schema: Schema,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<Schema> {
  const result = schema.safeParse(emptyAsUndefined(source));

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Variables de entorno inválidas:\n${detail}\n\n` +
        'Revisa apps/api/.env; la plantilla está en apps/api/.env.example.',
    );
  }

  return result.data;
}

const postgresUrl = z.url({ protocol: /^postgres(ql)?$/ });

// Lo que la API necesita para arrancar, y nada más.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),

  // Las dos cadenas de Neon se diferencian solo en el `-pooler` del host, así
  // que es fácil intercambiarlas sin darse cuenta. Detectarlo al arrancar es
  // mejor que ver fallar una migración con un error opaco de PgBouncer, o que
  // el runtime abra conexiones sin pool.
  DATABASE_URL: postgresUrl.refine((url) => url.includes('-pooler.'), {
    message: 'debe ser la conexión pooled de Neon (el host lleva "-pooler")',
  }),
  DIRECT_URL: postgresUrl.refine((url) => !url.includes('-pooler.'), {
    message: 'debe ser la conexión directa de Neon (el host no lleva "-pooler")',
  }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return parseEnvWith(envSchema, source);
}

// Se valida al importar el módulo: si algo falta, el proceso muere al
// arrancar y no a mitad de una petición.
export const env: Env = parseEnv();
