import { Injectable } from '@nestjs/common';
import type { KanjiDetail, KanjiGrade, KanjiGradeTable } from '@tokito/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { kanjiDetailSelect, kanjiSummarySelect, toKanjiDetail, toKanjiGradeTable } from './helpers/to-dto.js';

@Injectable()
export class KanjiService {
  constructor(private readonly prisma: PrismaService) {}

  async getGrade(grade: KanjiGrade): Promise<KanjiGradeTable> {
    const rows = await this.prisma.kanji.findMany({ where: { grade }, select: kanjiSummarySelect });
    return toKanjiGradeTable(grade, rows);
  }

  /** El kanji con sus trazos, o null si no está en el catálogo. */
  async getDetail(character: string): Promise<KanjiDetail | null> {
    const row = await this.prisma.kanji.findUnique({ where: { character }, select: kanjiDetailSelect });
    return row && toKanjiDetail(row);
  }
}
