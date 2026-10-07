import { createHash } from 'node:crypto';
import type { HashedPart } from '../types/prepared-section.js';

export const sha256 = (data: Buffer | string): string =>
  createHash('sha256').update(data).digest('hex');

/**
 * Huella del contenido de una pestaña: el texto y los hashes de sus imágenes,
 * en orden. Cambiar una imagen cambia la huella aunque el texto siga igual.
 *
 * La `contentUri` de una imagen no sirve para esto: es temporal y cambia en
 * cada lectura del documento. Por eso se hashea el contenido descargado.
 */
export function contentHash(parts: readonly HashedPart[]): string {
  const canonical = parts.map((part) =>
    part.kind === 'text' ? `t:${part.text}` : `i:${part.hash}`,
  );
  // JSON separa las partes sin ambigüedad aunque el texto traiga saltos de línea.
  return sha256(JSON.stringify(canonical));
}
