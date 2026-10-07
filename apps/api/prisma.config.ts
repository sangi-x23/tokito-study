import { defineConfig } from 'prisma/config';
import { loadEnvFile } from './src/config/load-env-file.js';

loadEnvFile();

// Prisma 7 saca la URL del schema y la trae aquí.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Las migraciones van por la conexión DIRECTA: PgBouncer no soporta las
    // sentencias que ejecuta el motor de esquema. El runtime sí usa la pooled,
    // a través del adaptador de Neon.
    //
    // Se lee de process.env sin validar con zod a propósito: `prisma generate`
    // no necesita conexión y tiene que funcionar en un clon recién hecho,
    // antes de que exista el .env.
    url: process.env.DIRECT_URL,
  },
});
