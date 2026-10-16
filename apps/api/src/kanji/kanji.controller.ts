import { Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import type { KanjiDetail, KanjiGradeTable } from '@tokito/shared';
import { CatalogCacheInterceptor } from '../content/cache.js';
import { parseParam } from '../content/schemas/params.schema.js';
import { KanjiService } from './kanji.service.js';
import { gradeSchema, kanjiCharacterSchema } from './schemas/params.schema.js';

@UseInterceptors(CatalogCacheInterceptor)
@Controller('kanji')
export class KanjiController {
  constructor(private readonly kanji: KanjiService) {}

  /** Los kanji de un grado, sin trazos: lo justo para la cuadrícula. */
  @Get('grades/:grade')
  getGrade(@Param('grade') grade: string): Promise<KanjiGradeTable> {
    return this.kanji.getGrade(parseParam(gradeSchema, grade, 'grade'));
  }

  /** Un kanji con sus lecturas, significados y trazos. */
  @Get(':character')
  async getDetail(@Param('character') character: string): Promise<KanjiDetail> {
    const detail = await this.kanji.getDetail(parseParam(kanjiCharacterSchema, character, 'character'));
    if (!detail) {
      throw new NotFoundException(`El kanji "${character}" no está en el catálogo`);
    }
    return detail;
  }
}
