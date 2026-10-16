import { Module } from '@nestjs/common';
import { VocabularyController } from './vocabulary.controller.js';
import { VocabularyService } from './vocabulary.service.js';

// El vocabulario por nivel del JLPT que muestra la sección Vocabulario.
// Público y de solo lectura: los datos los carga el seed `vocab:seed`.
@Module({
  controllers: [VocabularyController],
  providers: [VocabularyService],
})
export class VocabularyModule {}
