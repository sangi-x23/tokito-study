import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import { TopicsController } from './topics.controller.js';
import { TopicsService } from './topics.service.js';

// Lectura de temas e ítems: la parte pública y de solo lectura de la API.
@Module({
  controllers: [TopicsController, ItemsController],
  providers: [TopicsService, ItemsService],
})
export class ContentModule {}
