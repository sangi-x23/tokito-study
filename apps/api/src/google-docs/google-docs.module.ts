import { Module } from '@nestjs/common';
import { GoogleDocsService } from './google-docs.service.js';

// Lectura del documento del curso. No expone controladores: lo consumen el
// bootstrap local y, más adelante, el endpoint de ingesta.
@Module({
  providers: [GoogleDocsService],
  exports: [GoogleDocsService],
})
export class GoogleDocsModule {}
