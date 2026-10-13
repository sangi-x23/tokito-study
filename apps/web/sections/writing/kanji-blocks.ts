import type { KanjiSummary } from '@tokito/shared';

/** Cuántos kanji van en cada bloque de la cuadrícula de un grado. */
export const KANJI_BLOCK_SIZE = 50;

/**
 * Un tramo de la lista de un grado, que ya viene del más al menos usado.
 * `start` y `end` son posiciones dentro del grado, contadas desde 1.
 */
export interface KanjiBlock {
  readonly start: number;
  readonly end: number;
  readonly kanji: readonly KanjiSummary[];
}

/**
 * Parte la lista en bloques por posición. No por frecuencia: el resumen del
 * grado no la trae, y al final de secundaria van los que no tienen, ordenados
 * por carácter.
 */
export function kanjiBlocks(kanji: readonly KanjiSummary[], size = KANJI_BLOCK_SIZE): KanjiBlock[] {
  const blocks: KanjiBlock[] = [];
  for (let index = 0; index < kanji.length; index += size) {
    const slice = kanji.slice(index, index + size);
    blocks.push({ start: index + 1, end: index + slice.length, kanji: slice });
  }
  return blocks;
}

/** Minúsculas y sin tildes, para que «corazon» encuentre «corazón». */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/**
 * Si un kanji coincide con lo que se busca: el propio carácter dentro de la
 * búsqueda (pegar 学校 encuentra 学 y 校) o el texto dentro de su significado.
 */
export function matchesKanji(entry: KanjiSummary, query: string): boolean {
  const trimmed = query.trim();
  if (trimmed === '') {
    return true;
  }
  return trimmed.includes(entry.character) || normalize(entry.meaning).includes(normalize(trimmed));
}
