import { Module } from '@nestjs/common';
import { GoogleDocsModule } from '../google-docs/index.js';
import { LlmModule } from '../llm/index.js';
import { IngestionController } from './ingestion.controller.js';
import { IngestionService } from './ingestion.service.js';

// Ingesta incremental: el único endpoint que escribe, protegido con CRON_SECRET.
@Module({
  imports: [GoogleDocsModule, LlmModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
