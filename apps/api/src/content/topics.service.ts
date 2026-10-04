import { Injectable } from '@nestjs/common';
import type { TopicDetail, TopicNode } from '@tokito/shared';
import { PrismaService } from '../prisma/prisma.service';
import { itemSummaryInclude, toItemSummary, topicSummarySelect, toTopicSummary } from './helpers/to-dto';
import { buildTopicTree } from './helpers/topic-tree';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree(): Promise<TopicNode[]> {
    const rows = await this.prisma.topic.findMany({
      select: { ...topicSummarySelect, id: true, parentId: true, position: true },
    });
    return buildTopicTree(rows);
  }

  /** El tema con sus ítems directos y sus subtemas, o null si no existe. */
  async getDetail(slug: string): Promise<TopicDetail | null> {
    const topic = await this.prisma.topic.findUnique({
      where: { slug },
      select: {
        ...topicSummarySelect,
        parent: { select: { slug: true, name: true } },
        children: { select: topicSummarySelect, orderBy: [{ position: 'asc' }, { name: 'asc' }] },
        items: {
          orderBy: { position: 'asc' },
          select: { item: { include: itemSummaryInclude } },
        },
      },
    });

    if (!topic) {
      return null;
    }

    return {
      ...toTopicSummary(topic),
      parent: topic.parent,
      children: topic.children.map(toTopicSummary),
      items: topic.items.map((link) => toItemSummary(link.item)),
    };
  }
}
