import { Module } from '@nestjs/common';
import { KanaController } from './kana.controller.js';
import { KanaService } from './kana.service.js';

// Lectura de los kana para la sección Escritura. Pública y de solo lectura:
// los datos los carga el seed `kana:seed`.
@Module({
  controllers: [KanaController],
  providers: [KanaService],
})
export class WritingModule {}
