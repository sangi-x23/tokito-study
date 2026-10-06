import type { ParsedSection } from '../../google-docs/index.js';
import type { LlmPart } from '../../llm/index.js';
import type { DownloadedImage, HashedPart, PreparedPart, PreparedSection } from '../types/prepared-section.js';
import { contentHash, sha256 } from './content-hash.js';

/**
 * Descarga las imágenes de una pestaña y calcula su huella. Es el paso previo
 * a decidir si hay que extraerla: si la huella no cambió, no se llama al LLM.
 *
 * Una imagen repetida dentro de la pestaña se queda solo en su primera
 * aparición; mandarla dos veces gastaría tokens y el modelo devolvería su
 * texto dos veces.
 */
export async function prepareSection(
  section: ParsedSection,
  download: (contentUri: string) => Promise<DownloadedImage>,
): Promise<PreparedSection> {
  const parts: PreparedPart[] = [];
  const seen = new Set<string>();

  for (const part of section.parts) {
    if (part.kind === 'text') {
      parts.push(part);
      continue;
    }

    const image = await download(part.contentUri);
    const hash = sha256(image.data);
    if (!seen.has(hash)) {
      seen.add(hash);
      parts.push({ kind: 'image', hash, image });
    }
  }

  const hashed = parts.map(
    (part): HashedPart => (part.kind === 'text' ? part : { kind: 'image', hash: part.hash }),
  );

  return { section, contentHash: contentHash(hashed), parts, imageHashes: [...seen] };
}

/**
 * Arma las partes que recibe el LLM. Las imágenes que ya están en la caché de
 * `ImageAsset` se sustituyen por su texto y no se vuelven a mandar; las nuevas
 * se reducen y llevan su hash como `imageId`, para casar el texto que devuelva
 * el modelo con la entrada de la caché.
 */
export async function toLlmParts(
  prepared: PreparedSection,
  cachedTexts: ReadonlyMap<string, string>,
  shrink: (data: Buffer) => Promise<DownloadedImage>,
): Promise<LlmPart[]> {
  const parts: LlmPart[] = [];

  for (const part of prepared.parts) {
    if (part.kind === 'text') {
      parts.push(part);
      continue;
    }

    const cached = cachedTexts.get(part.hash);
    if (cached !== undefined) {
      parts.push({ kind: 'text', text: `[Texto de una imagen de la clase]\n${cached}` });
      continue;
    }

    const small = await shrink(part.image.data);
    parts.push({ kind: 'image', imageId: part.hash, mimeType: small.mimeType, data: small.data });
  }

  return parts;
}
