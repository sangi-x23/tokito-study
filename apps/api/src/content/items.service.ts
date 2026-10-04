import { Injectable } from '@nestjs/common';
import type { ItemDetail, RelatedWord } from '@tokito/shared';
import { PrismaService } from '../prisma/prisma.service';
import { itemDetailInclude, toItemDetail } from './helpers/to-dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  /** El ítem con todos sus temas y clases, o null si no existe. */
  async getDetail(id: string): Promise<ItemDetail | null> {
    const item = await this.prisma.studyItem.findUnique({ where: { id }, include: itemDetailInclude });
    if (!item) {
      return null;
    }

    const relatedWords = item.type === 'KANJI' ? await this.wordsUsing(item.japanese) : [];
    return toItemDetail(item, relatedWords);
  }

  /**
   * Las palabras que usan un kanji no se guardan: se derivan con un `LIKE`.
   * A la escala de un curso es trivial para Postgres, y una tabla de enlace
   * habría que mantenerla al día con cada palabra nueva.
   */
  private wordsUsing(kanji: string): Promise<RelatedWord[]> {
    return this.prisma.studyItem.findMany({
      where: { type: 'WORD', japanese: { contains: kanji } },
      select: { id: true, japanese: true, reading: true, meaning: true },
      orderBy: { japanese: 'asc' },
    });
  }
}
