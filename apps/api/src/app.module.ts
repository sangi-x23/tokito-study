import { Module } from '@nestjs/common';
import { ContentModule } from './content/content.module.js';
import { GoogleDocsModule } from './google-docs/google-docs.module.js';
import { HealthModule } from './health/health.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { LlmModule } from './llm/llm.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, HealthModule, ContentModule, GoogleDocsModule, LlmModule, IngestionModule],
})
export class AppModule {}
