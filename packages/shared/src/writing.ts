// Contratos de la sección Escritura. Los produce `apps/api` y los consume
// `apps/web`.

export type KanaScript = 'HIRAGANA' | 'KATAKANA';

export type KanaKind = 'BASIC' | 'DAKUTEN' | 'HANDAKUTEN' | 'SMALL' | 'COMBINATION' | 'EXTENDED';

export interface Kana {
  /** Uno o varios caracteres: き, きゃ, ファ. */
  readonly character: string;
  readonly kind: KanaKind;
  /** Hepburn, salvo を = wo. Los pequeños llevan el de su versión grande. */
  readonly romaji: string;
  /** Celda en la cuadrícula de su grupo; puede haber huecos. */
  readonly row: number;
  readonly column: number;
  /**
   * Trazos en orden, como el atributo `d` de un `<path>` SVG sobre un lienzo
   * de 109×109 (KanjiVG, CC BY-SA 3.0). Vacío en los kana de varios
   * caracteres: se dibujan con los trazos de cada carácter, que están en la
   * misma tabla (きゃ = き + ゃ).
   */
  readonly strokes: readonly string[];
}

export interface KanaGroup {
  readonly kind: KanaKind;
  /** Ordenados por fila y columna. */
  readonly kana: readonly Kana[];
}

/** `GET /kana/:script` */
export interface KanaTable {
  readonly script: KanaScript;
  /** Básicos, dakuten, handakuten, pequeños, combinaciones y extendidos, en ese orden. Sin grupos vacíos. */
  readonly groups: readonly KanaGroup[];
}
