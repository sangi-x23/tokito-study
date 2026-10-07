import { ConflictException, Controller, Get, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { LlmQuotaExhaustedError } from '../llm/index.js';
import { CronSecretGuard } from './cron-secret.guard.js';
import { IngestionLockedError } from './helpers/ingestion-run.js';
import { IngestionService } from './ingestion.service.js';
import type { IngestionSummary } from './types/ingestion.js';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  /**
   * Lo dispara Vercel Cron, que solo hace GET y manda el `CRON_SECRET` en el
   * header. También sirve para correrla a mano con el mismo header.
   */
  @Get('run')
  @UseGuards(CronSecretGuard)
  async run(): Promise<IngestionSummary> {
    try {
      return await this.ingestion.run();
    } catch (error) {
      if (error instanceof IngestionLockedError) {
        throw new ConflictException(error.message);
      }
      // Lo procesado antes de agotarse la cuota ya quedó escrito; el resto
      // entra en la próxima corrida.
      if (error instanceof LlmQuotaExhaustedError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }
}
