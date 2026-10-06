export interface DocumentMeta {
  readonly googleDocId: string;
  readonly title: string;
  readonly revisionId: string | null;
}

export interface WriteSummary {
  readonly sections: number;
  readonly topics: { readonly created: number; readonly updated: number };
  readonly items: { readonly created: number; readonly updated: number };
  readonly itemTopics: { readonly created: number; readonly updated: number; readonly removed: number };
  readonly occurrences: number;
  readonly images: number;
}

export interface SectionWriteSummary extends WriteSummary {
  /** Apariciones quitadas: ítems que ya no están en la pestaña. */
  readonly occurrencesRemoved: number;
}
