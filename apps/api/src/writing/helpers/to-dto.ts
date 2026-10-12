import type { KanaGroup, KanaKind, KanaScript, KanaTable } from '@tokito/shared';
import type { Prisma } from '../../generated/prisma/client.js';

/** Lo que hace falta de un kana para el contrato `Kana`. */
export const kanaSelect = {
  character: true,
  kind: true,
  romaji: true,
  row: true,
  column: true,
  strokes: true,
} satisfies Prisma.KanaSelect;

export type KanaRow = Prisma.KanaGetPayload<{ select: typeof kanaSelect }>;

// Orden de los grupos en la tabla: el mismo en que se enseñan.
const KIND_ORDER: readonly KanaKind[] = ['BASIC', 'DAKUTEN', 'HANDAKUTEN', 'SMALL', 'COMBINATION', 'EXTENDED'];

/** Agrupa los kana de un script por tipo, cada grupo ordenado por celda. */
export function toKanaTable(script: KanaScript, rows: readonly KanaRow[]): KanaTable {
  const groups: KanaGroup[] = KIND_ORDER.flatMap((kind) => {
    const kana = rows
      .filter((row) => row.kind === kind)
      .sort((a, b) => a.row - b.row || a.column - b.column)
      .map((row) => ({
        character: row.character,
        kind: row.kind,
        romaji: row.romaji,
        row: row.row,
        column: row.column,
        strokes: row.strokes,
      }));
    return kana.length > 0 ? [{ kind, kana }] : [];
  });

  return { script, groups };
}
