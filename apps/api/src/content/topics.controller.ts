import { Controller, Get } from '@nestjs/common';
import { TopicsService } from './topics.service';
import type { Topic } from '../generated/prisma/client';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  @Get()
  findAll(): Promise<Topic[]> {
    return this.topics.findAll();
  }
}
