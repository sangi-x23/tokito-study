import { Module } from '@nestjs/common';
import { GoogleDocsModule } from '../google-docs';
import { LlmModule } from '../llm';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

// Ingesta incremental: el único endpoint que escribe, protegido con CRON_SECRET.
@Module({
  imports: [GoogleDocsModule, LlmModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
