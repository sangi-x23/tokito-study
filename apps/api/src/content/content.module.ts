import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

// Lectura de temas e ítems: la parte pública y de solo lectura de la API.
@Module({
  controllers: [TopicsController, ItemsController],
  providers: [TopicsService, ItemsService],
})
export class ContentModule {}
