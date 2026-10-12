import type { Kana } from '@tokito/shared';
import type { CSSProperties } from 'react';

// Lo que comparten la cuadrícula estática y la de tarjetas clickeables: cada
// kana va en su fila y columna, y las celdas sin kana quedan vacías.

export function gridProps(kana: readonly Kana[]): { className: string; style: CSSProperties } {
  const columns = Math.max(...kana.map((entry) => entry.column)) + 1;
  return {
    className: `grid gap-2 ${columns > 3 ? 'max-w-xl' : 'max-w-sm'}`,
    style: { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` },
  };
}

export const cellStyle = (kana: Kana): CSSProperties => ({
  gridRowStart: kana.row + 1,
  gridColumnStart: kana.column + 1,
});

export const CELL_CLASS =
  'flex w-full flex-col items-center gap-0.5 rounded-xl border border-slate-200 py-3 dark:border-slate-800';
