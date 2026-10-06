import { Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import type { TopicDetail, TopicNode } from '@tokito/shared';
import { PublicCacheInterceptor } from './cache.js';
import { parseParam, slugSchema } from './schemas/params.schema.js';
import { TopicsService } from './topics.service.js';

@UseInterceptors(PublicCacheInterceptor)
@Controller('topics')
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  /** El árbol de temas: los de primer nivel con sus subtemas. */
  @Get()
  getTree(): Promise<TopicNode[]> {
    return this.topics.getTree();
  }

  @Get(':slug')
  async getDetail(@Param('slug') slug: string): Promise<TopicDetail> {
    const detail = await this.topics.getDetail(parseParam(slugSchema, slug, 'slug'));
    if (!detail) {
      throw new NotFoundException(`No existe el tema "${slug}"`);
    }
    return detail;
  }
}
