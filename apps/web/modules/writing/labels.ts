import type { KanaKind } from '@tokito/shared';

export const KANA_KIND_LABEL: Record<KanaKind, string> = {
  BASIC: 'Básicos',
  DAKUTEN: 'Dakuten',
  HANDAKUTEN: 'Handakuten',
  SMALL: 'Pequeños',
  COMBINATION: 'Combinaciones',
  EXTENDED: 'Extendidos',
};

export const KANA_KIND_DESCRIPTION: Record<KanaKind, string> = {
  BASIC: 'Los sonidos base, en el orden de la tabla tradicional.',
  DAKUTEN:
    'Llevan el tenten ゛, dos comillas arriba a la derecha que vuelven sonora la consonante: k → g, s → z, t → d, h → b.',
  HANDAKUTEN: 'Llevan el maru ゜, un círculo arriba a la derecha que convierte la fila de h en p.',
  SMALL:
    'Se escriben más chicos y modifican al kana de al lado: la tsu pequeña alarga la consonante siguiente y ya, yu, yo forman combinaciones.',
  COMBINATION: 'Un kana de la columna i seguido de ya, yu o yo pequeños: se leen como una sola sílaba.',
  EXTENDED: 'Combinaciones para sonidos que no existen en japonés, usadas en palabras extranjeras.',
};
