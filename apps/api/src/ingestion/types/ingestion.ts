import type { ParsedDocument } from '../../google-docs';
import type { PreparedSection } from './prepared-section';

export interface SectionChanges {
  readonly document: ParsedDocument;
  /** Pestañas nuevas o con huella distinta, en el orden del documento. */
  readonly changed: readonly PreparedSection[];
  readonly unchanged: number;
}

export interface IngestionSummary {
  readonly sectionsProcessed: number;
  readonly unchanged: number;
  /** Pestañas cambiadas que no entraron en el tiempo de esta corrida. */
  readonly deferred: readonly string[];
  readonly topicsCreated: number;
  readonly itemsCreated: number;
  readonly occurrencesAdded: number;
  readonly occurrencesRemoved: number;
  readonly imagesCached: number;
}

export interface RunOptions {
  /** Tiempo tras el cual no se empieza otra pestaña. `Infinity` en local. */
  readonly timeBudgetMs?: number;
}
