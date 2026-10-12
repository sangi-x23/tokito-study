import { Injectable } from '@nestjs/common';
import type { KanaScript, KanaTable } from '@tokito/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { kanaSelect, toKanaTable } from './helpers/to-dto.js';

@Injectable()
export class KanaService {
  constructor(private readonly prisma: PrismaService) {}

  async getTable(script: KanaScript): Promise<KanaTable> {
    const rows = await this.prisma.kana.findMany({ where: { script }, select: kanaSelect });
    return toKanaTable(script, rows);
  }
}
