import type { JlptLevel } from '@tokito/shared';

/**
 * Los niveles del JLPT, del más fácil al más difícil, en el orden de la barra.
 * `slug` es el de la URL; `level`, el de la API.
 */
export const JLPT_LEVELS = [
  { slug: 'n5', level: 5, label: 'N5', description: 'Lo básico: saludos, la vida diaria y las frases más simples.' },
  { slug: 'n4', level: 4, label: 'N4', description: 'Conversaciones cotidianas a ritmo lento y textos sencillos.' },
  { slug: 'n3', level: 3, label: 'N3', description: 'El puente: situaciones diarias con naturalidad y textos concretos.' },
  { slug: 'n2', level: 2, label: 'N2', description: 'Noticias, artículos y conversaciones a velocidad casi natural.' },
  { slug: 'n1', level: 1, label: 'N1', description: 'Textos complejos y abstractos, y japonés a velocidad nativa.' },
] as const satisfies readonly { slug: string; level: JlptLevel; label: string; description: string }[];

export type JlptLevelEntry = (typeof JLPT_LEVELS)[number];

export function findLevelBySlug(slug: string): JlptLevelEntry | null {
  return JLPT_LEVELS.find((entry) => entry.slug === slug) ?? null;
}

export function findLevel(level: JlptLevel): JlptLevelEntry {
  return JLPT_LEVELS.find((entry) => entry.level === level)!;
}
