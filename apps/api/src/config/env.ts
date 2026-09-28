import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

// En local las variables viven en apps/api/.env; en Vercel las inyecta la
// plataforma y el archivo no existe, por eso la carga es opcional.
// `loadEnvFile` nunca pisa una variable ya presente en el entorno, así que
// en Vercel siempre mandan los valores de la plataforma.
const envFilePath = resolve(process.cwd(), '.env');
if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

const postgresUrl = z.url({ protocol: /^postgres(ql)?$/ });

// Cada variable entra a este esquema en la fase que empieza a leerla.
// Exigir una que todavía nadie usa solo consigue que la app no arranque.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),

  // Fase 1 · Neon. Las dos cadenas se diferencian solo en el `-pooler` del
  // host, así que es fácil intercambiarlas sin darse cuenta. Detectarlo al
  // arrancar es mejor que ver fallar una migración con un error opaco de
  // PgBouncer, o que el runtime abra conexiones sin pool.
  DATABASE_URL: postgresUrl.refine((url) => url.includes('-pooler.'), {
    message: 'debe ser la conexión pooled de Neon (el host lleva "-pooler")',
  }),
  DIRECT_URL: postgresUrl.refine((url) => !url.includes('-pooler.'), {
    message: 'debe ser la conexión directa de Neon (el host no lleva "-pooler")',
  }),
});

export type Env = z.infer<typeof envSchema>;

// Un .env recién copiado de la plantilla trae todas las claves vacías. Tratar
// el string vacío como ausente evita dos cosas: que PORT= se lea como 0 y
// falle .positive(), y que el error diga "formato inválido" cuando lo que pasa
// en realidad es que falta el valor.
function emptyAsUndefined(source: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === '' ? undefined : value]),
  );
}
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(emptyAsUndefined(source));

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

// Se valida al importar el módulo: si algo falta, el proceso muere al
// arrancar y no a mitad de una petición.
export const env: Env = parseEnv();
