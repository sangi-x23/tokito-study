import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import type { KanaTable } from '@tokito/shared';
import { PublicCacheInterceptor } from '../content/cache.js';
import { parseParam } from '../content/schemas/params.schema.js';
import { KanaService } from './kana.service.js';
import { scriptSchema } from './schemas/params.schema.js';

@UseInterceptors(PublicCacheInterceptor)
@Controller('kana')
export class KanaController {
  constructor(private readonly kana: KanaService) {}

  /** La tabla de un script, agrupada por tipo y con los trazos de cada kana. */
  @Get(':script')
  getTable(@Param('script') script: string): Promise<KanaTable> {
    return this.kana.getTable(parseParam(scriptSchema, script, 'script'));
  }
}
