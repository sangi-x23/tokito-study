import { Module } from '@nestjs/common';
import { KanjiController } from './kanji.controller.js';
import { KanjiService } from './kanji.service.js';

// El catálogo de kanji jōyō que muestra la sección Escritura. Público y de
// solo lectura: los datos los carga el seed `kanji:seed`.
@Module({
  controllers: [KanjiController],
  providers: [KanjiService],
})
export class KanjiModule {}
