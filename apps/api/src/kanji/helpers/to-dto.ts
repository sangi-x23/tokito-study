import type { KanjiDetail, KanjiGrade, KanjiGradeTable } from '@tokito/shared';
import type { Prisma } from '../../generated/prisma/client.js';

/** Lo que hace falta de un kanji para una celda de la cuadrícula. */
export const kanjiSummarySelect = {
  character: true,
  frequency: true,
  meanings: true,
} satisfies Prisma.KanjiSelect;

export type KanjiSummaryRow = Prisma.KanjiGetPayload<{ select: typeof kanjiSummarySelect }>;

/**
 * Los kanji de un grado, del más al menos frecuente. Los que no están entre
 * los 2 500 más usados (unos 100 de secundaria) van al final, por carácter.
 */
export function toKanjiGradeTable(grade: KanjiGrade, rows: readonly KanjiSummaryRow[]): KanjiGradeTable {
  const kanji = [...rows]
    .sort((a, b) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity) || (a.character < b.character ? -1 : 1))
    .map((row) => ({ character: row.character, meaning: row.meanings[0] ?? '' }));

  return { grade, kanji };
}

export const kanjiDetailSelect = {
  character: true,
  grade: true,
  frequency: true,
  meanings: true,
  onyomi: true,
  kunyomi: true,
  strokes: true,
} satisfies Prisma.KanjiSelect;

export type KanjiDetailRow = Prisma.KanjiGetPayload<{ select: typeof kanjiDetailSelect }>;

export function toKanjiDetail(row: KanjiDetailRow): KanjiDetail {
  return {
    character: row.character,
    grade: row.grade as KanjiGrade,
    frequency: row.frequency,
    meanings: row.meanings,
    onyomi: row.onyomi,
    kunyomi: row.kunyomi,
    strokes: row.strokes,
  };
}
