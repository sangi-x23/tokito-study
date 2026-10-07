// Barril de los módulos de Nest que registra `AppModule`. Un módulo nuevo se
// exporta aquí y se agrega a los `imports` de `app.module.ts`.
export { ContentModule } from './content/content.module.js';
export { GoogleDocsModule } from './google-docs/google-docs.module.js';
export { HealthModule } from './health/health.module.js';
export { IngestionModule } from './ingestion/ingestion.module.js';
export { LlmModule } from './llm/llm.module.js';
export { PrismaModule } from './prisma/prisma.module.js';
