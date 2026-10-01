/**
 * El contenido de una pestaña como una secuencia ordenada de partes.
 *
 * El orden importa: una imagen suele ilustrar el texto que la precede, así que
 * el LLM necesita verlas intercaladas en su posición original y no el texto por
 * un lado y las imágenes por otro.
 */
export type DocumentPart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'image'; readonly objectId: string; readonly contentUri: string };

/** Una pestaña del documento = una clase. */
export interface ParsedSection {
  readonly tabId: string;
  readonly title: string;
  /** Orden de la pestaña dentro del documento, ya aplanado. */
  readonly position: number;
  readonly parts: readonly DocumentPart[];
  /** Solo el texto, concatenado. Es lo que se guarda en `Section.rawText`. */
  readonly rawText: string;
}

export interface ParsedDocument {
  readonly documentId: string;
  readonly title: string;
  readonly revisionId: string | null;
  readonly sections: readonly ParsedSection[];
}
