import { Injectable } from '@nestjs/common';
import type { JlptLevel, VocabularyLevelList, VocabularyWord } from '@tokito/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  toVocabularyLevelList,
  toVocabularyWord,
  vocabularySummarySelect,
  vocabularyWordSelect,
} from './helpers/to-dto.js';

@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  async getLevel(level: JlptLevel): Promise<VocabularyLevelList> {
    const rows = await this.prisma.vocabulary.findMany({ where: { level }, select: vocabularySummarySelect });
    return toVocabularyLevelList(level, rows);
  }

  /** La palabra con su significado y sus ejemplos, o null si no existe. */
  async getWord(id: string): Promise<VocabularyWord | null> {
    const row = await this.prisma.vocabulary.findUnique({ where: { id }, select: vocabularyWordSelect });
    return row && toVocabularyWord(row);
  }
}
