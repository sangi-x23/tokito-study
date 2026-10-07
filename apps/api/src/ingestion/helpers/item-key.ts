import type { ItemType } from '../../generated/prisma/enums.js';

// Signos de cierre que el curso pone o no según el día: `おなまえは？` y
// `おなまえは` son el mismo ítem.
const TRAILING_PUNCTUATION = /[。？?]+$/u;

/**
 * La clave natural de `StudyItem`, normalizada para que un mismo ítem escrito
 * de dos formas no se duplique: forma Unicode NFC, sin espacios (tampoco los
 * de ancho completo), sin `。`/`？` al final y con paréntesis de ancho
 * completo. Son las convenciones con las que se corrigió el bootstrap.
 */
export function normalizeJapanese(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\s+/gu, '')
    .replace(/\(/g, '（')
    .replace(/\)/g, '）')
    .replace(TRAILING_PUNCTUATION, '');
}

export const itemKey = (type: ItemType | string, japanese: string): string => `${type}\u0000${japanese}`;
