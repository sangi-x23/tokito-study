import type { KanjiGrade } from '@tokito/shared';

/**
 * Los grados de los kanji jōyō, en el orden de la barra. `slug` es el de la
 * URL; `grade`, el de la API (KANJIDIC2 numera la secundaria como 8).
 */
export const KANJI_GRADES = [
  { slug: '1', grade: 1, label: '1.º de primaria', shortLabel: '1.º' },
  { slug: '2', grade: 2, label: '2.º de primaria', shortLabel: '2.º' },
  { slug: '3', grade: 3, label: '3.º de primaria', shortLabel: '3.º' },
  { slug: '4', grade: 4, label: '4.º de primaria', shortLabel: '4.º' },
  { slug: '5', grade: 5, label: '5.º de primaria', shortLabel: '5.º' },
  { slug: '6', grade: 6, label: '6.º de primaria', shortLabel: '6.º' },
  { slug: 'secundaria', grade: 8, label: 'Secundaria', shortLabel: 'Secundaria' },
] as const satisfies readonly { slug: string; grade: KanjiGrade; label: string; shortLabel: string }[];

export type KanjiGradeEntry = (typeof KANJI_GRADES)[number];

export function findGradeBySlug(slug: string): KanjiGradeEntry | null {
  return KANJI_GRADES.find((entry) => entry.slug === slug) ?? null;
}

export function findGrade(grade: KanjiGrade): KanjiGradeEntry {
  return KANJI_GRADES.find((entry) => entry.grade === grade)!;
}
