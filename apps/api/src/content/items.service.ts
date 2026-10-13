import { Injectable } from '@nestjs/common';
import type { ItemDetail, RelatedWord } from '@tokito/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { itemDetailInclude, toItemDetail } from './helpers/to-dto.js';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  /** El ítem con todos sus temas y clases, o null si no existe. */
  async getDetail(id: string): Promise<ItemDetail | null> {
    const item = await this.prisma.studyItem.findUnique({ where: { id }, include: itemDetailInclude });
    if (!item) {
      return null;
    }

    if (item.type !== 'KANJI') {
      return toItemDetail(item, [], false);
    }
    const [relatedWords, inKanjiCatalog] = await Promise.all([
      this.wordsUsing(item.japanese),
      this.isInKanjiCatalog(item.japanese),
    ]);
    return toItemDetail(item, relatedWords, inKanjiCatalog);
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

  /**
   * El Diario depende del catálogo de Escritura, y no al revés: se buscan por
   * el carácter, sin relación en el schema. Un kanji del curso que no es jōyō
   * simplemente no enlaza a sus trazos.
   */
  private async isInKanjiCatalog(kanji: string): Promise<boolean> {
    return (await this.prisma.kanji.count({ where: { character: kanji } })) > 0;
  }
}
