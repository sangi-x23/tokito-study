import type { KanaKind, KanaScript } from '../../generated/prisma/enums.js';

/** Un kana tal como lo define la tabla del seed, sin trazos. */
export interface KanaDefinition {
  readonly character: string;
  readonly script: KanaScript;
  readonly kind: KanaKind;
  readonly romaji: string;
  readonly row: number;
  readonly column: number;
}

/** Un kana listo para escribir en la base, con sus trazos de KanjiVG. */
export interface KanaSeed extends KanaDefinition {
  readonly strokes: readonly string[];
}

/** Lo que el seed necesita leer de cada fila existente para compararla. */
export interface StoredKana extends KanaSeed {
  readonly id: string;
}

export interface KanaSeedPlan {
  readonly create: readonly KanaSeed[];
  readonly update: readonly { readonly id: string; readonly kana: KanaSeed }[];
  readonly unchanged: number;
  /** Filas de la base que la tabla ya no define. No se borran: se avisan. */
  readonly orphaned: readonly string[];
}
