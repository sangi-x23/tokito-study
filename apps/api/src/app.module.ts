import { Module } from '@nestjs/common';
import * as modules from './modules.js';

// Registra todo lo que exporta el barril: un módulo nuevo solo se agrega en
// `modules.ts`. El orden no importa, Nest resuelve las dependencias.
@Module({
  imports: Object.values(modules),
})
export class AppModule {}
