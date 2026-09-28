import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

// Lectura de temas e ítems: la parte pública y de solo lectura de la API.
@Module({
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class ContentModule {}
