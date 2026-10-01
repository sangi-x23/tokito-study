import { Module } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { LLM_PROVIDER } from './types/llm-provider';

// Quien consume el módulo inyecta `LLM_PROVIDER` y recibe la interfaz, no
// Gemini: cambiar de proveedor es cambiar esta línea.
@Module({
  providers: [{ provide: LLM_PROVIDER, useFactory: () => new GeminiProvider() }],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
