// Contratos del catálogo de kanji (`apps/api/src/kanji`). Los consume la
// sección Escritura de `apps/web`.

/** Grado escolar de un kanji jōyō: 1–6 son los de primaria (kyōiku); 8, los de secundaria. */
export type KanjiGrade = 1 | 2 | 3 | 4 | 5 | 6 | 8;

/** Lo que muestra cada celda de la cuadrícula de un grado. */
export interface KanjiSummary {
  readonly character: string;
  /** El significado principal, en español. */
  readonly meaning: string;
}

/** `GET /kanji/grades/:grade` */
export interface KanjiGradeTable {
  readonly grade: KanjiGrade;
  /** Del más frecuente al menos frecuente. */
  readonly kanji: readonly KanjiSummary[];
}

/**
 * `GET /kanji/:character`. Las lecturas y significados son los del
 * diccionario (KANJIDIC2), no los que enseñó el curso: esos están en el
 * Diario.
 */
export interface KanjiDetail {
  readonly character: string;
  readonly grade: KanjiGrade;
  /** Puesto entre los 2 500 kanji más usados en prensa; null si no está entre ellos. */
  readonly frequency: number | null;
  /** En español, del más al menos usual. */
  readonly meanings: readonly string[];
  /** En katakana: ニチ, ジツ. */
  readonly onyomi: readonly string[];
  /**
   * En hiragana, con la notación de KANJIDIC2: el punto separa la raíz del
   * okurigana (`まな.ぶ` se escribe 学ぶ) y el guion marca un prefijo o sufijo
   * (`-び`).
   */
  readonly kunyomi: readonly string[];
  /** Trazos en orden, como en `Kana`. Su largo es el número de trazos. */
  readonly strokes: readonly string[];
}
