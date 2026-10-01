import { Injectable, Logger } from '@nestjs/common';
import type { docs_v1 } from 'googleapis';
import type { ParsedDocument } from './types/document-part';
import { parseDocument } from './helpers/document-parser';
import { createDocsClient } from './config/google-docs.client';
import { loadGoogleEnv } from './config/google-docs.env';

@Injectable()
export class GoogleDocsService {
  private readonly logger = new Logger(GoogleDocsService.name);
  private client: docs_v1.Docs | undefined;

  /**
   * Lee el documento del curso y lo devuelve ya parseado en secciones.
   *
   * `includeTabsContent` es imprescindible: sin él la respuesta trae solo la
   * primera pestaña y el resto de las clases se pierde en silencio.
   */
  async fetchDocument(documentId?: string): Promise<ParsedDocument> {
    const env = loadGoogleEnv();
    const id = documentId ?? env.GOOGLE_DOC_ID;

    this.logger.log(`Leyendo el documento ${id}`);

    const response = await this.getClient().documents.get({
      documentId: id,
      includeTabsContent: true,
    });

    const parsed = parseDocument(response.data, { skipTabIds: env.GOOGLE_DOC_SKIP_TABS });

    this.logger.log(
      `${parsed.sections.length} pestañas leídas de "${parsed.title}" (revisión ${parsed.revisionId ?? 'desconocida'})`,
    );

    return parsed;
  }

  // Perezoso: construirlo en el constructor obligaría a tener credenciales de
  // Google para instanciar el módulo, aunque nadie vaya a leer el documento.
  private getClient(): docs_v1.Docs {
    this.client ??= createDocsClient();
    return this.client;
  }
}
