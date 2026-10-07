import { Module } from '@nestjs/common';
import {
  ContentModule,
  GoogleDocsModule,
  HealthModule,
  IngestionModule,
  LlmModule,
  PrismaModule,
} from './modules.js';

@Module({
  imports: [PrismaModule, HealthModule, ContentModule, GoogleDocsModule, LlmModule, IngestionModule],
})
export class AppModule {}
