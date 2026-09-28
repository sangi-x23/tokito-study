import { GoogleDocsService } from '../google-docs/google-docs.service';
import type { ParsedSection } from '../google-docs/document-part';

/**
 * Imprime las secciones del documento del curso para inspeccionarlas a ojo.
 *
 * Sirve sobre todo para calibrar el descarte de datos personales: hay que mirar
 * el encabezado real de una clase y ajustar `strip-personal-data.ts`.
 *
 *   pnpm --filter @tokito/api docs:print
 *   pnpm --filter @tokito/api docs:print -- --full
 */
const PREVIEW_CHARS = 280;

function preview(section: ParsedSection, full: boolean): string {
  if (full) {
    return section.rawText;
  }

  const text = section.rawText.slice(0, PREVIEW_CHARS);
  return section.rawText.length > PREVIEW_CHARS ? `${text}…` : text;
}

async function main(): Promise<void> {
  const full = process.argv.includes('--full');
  const parsed = await new GoogleDocsService().fetchDocument();

  console.log(`\nDocumento : ${parsed.title}`);
  console.log(`Revisión  : ${parsed.revisionId ?? '(desconocida)'}`);
  console.log(`Pestañas  : ${parsed.sections.length}\n`);

  for (const section of parsed.sections) {
    const images = section.parts.filter((part) => part.kind === 'image').length;
    const textParts = section.parts.length - images;

    console.log('─'.repeat(72));
    console.log(`[${section.position}] ${section.title || '(sin título)'}`);
    console.log(`     tabId: ${section.tabId}`);
    console.log(`     partes: ${textParts} de texto, ${images} imágenes`);
    console.log(`     caracteres: ${section.rawText.length}`);
    console.log('');
    console.log(preview(section, full));
    console.log('');
  }

  console.log('─'.repeat(72));
  const totalImages = parsed.sections.reduce(
    (sum, section) => sum + section.parts.filter((part) => part.kind === 'image').length,
    0,
  );
  console.log(`Total: ${parsed.sections.length} secciones, ${totalImages} imágenes\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
