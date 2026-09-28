import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Topic } from '../generated/prisma/client';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lectura plana por ahora. El árbol jerárquico y el detalle con ítems
  // llegan en la Fase 6.
  findAll(): Promise<Topic[]> {
    return this.prisma.topic.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }
}
