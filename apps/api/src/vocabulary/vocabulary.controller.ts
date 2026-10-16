import { Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import type { VocabularyLevelList, VocabularyWord } from '@tokito/shared';
import { PublicCacheInterceptor } from '../content/cache.js';
import { idSchema, parseParam } from '../content/schemas/params.schema.js';
import { levelSchema } from './schemas/params.schema.js';
import { VocabularyService } from './vocabulary.service.js';

@UseInterceptors(PublicCacheInterceptor)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabulary: VocabularyService) {}

  /** Las palabras de un nivel, sin significado ni ejemplos: lo justo para la lista. */
  @Get('levels/:level')
  getLevel(@Param('level') level: string): Promise<VocabularyLevelList> {
    return this.vocabulary.getLevel(parseParam(levelSchema, level, 'level'));
  }

  /** Una palabra con su significado y sus ejemplos. */
  @Get('words/:id')
  async getWord(@Param('id') id: string): Promise<VocabularyWord> {
    const word = await this.vocabulary.getWord(parseParam(idSchema, id, 'id'));
    if (!word) {
      throw new NotFoundException(`La palabra "${id}" no existe`);
    }
    return word;
  }
}
