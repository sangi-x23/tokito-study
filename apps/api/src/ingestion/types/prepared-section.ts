import type { ParsedSection } from '../../google-docs/index.js';

/** Una parte de la pestaña con la imagen ya reducida a su hash. */
export type HashedPart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'image'; readonly hash: string };

export interface DownloadedImage {
  readonly data: Buffer;
  readonly mimeType: string;
}

export type PreparedPart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'image'; readonly hash: string; readonly image: DownloadedImage };

/** Una pestaña con sus imágenes ya descargadas y hasheadas. */
export interface PreparedSection {
  readonly section: ParsedSection;
  readonly contentHash: string;
  readonly parts: readonly PreparedPart[];
  /** Hashes distintos de las imágenes, en orden de aparición. */
  readonly imageHashes: readonly string[];
}
