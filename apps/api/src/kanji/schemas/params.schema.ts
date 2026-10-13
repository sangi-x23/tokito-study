import type { KanjiGrade } from '@tokito/shared';
import { z } from 'zod';

// Como en KANJIDIC2: 1–6 de primaria y 8 de secundaria.
export const gradeSchema = z
  .enum(['1', '2', '3', '4', '5', '6', '8'])
  .transform((grade): KanjiGrade => Number(grade) as KanjiGrade);

/** Un solo kanji. `𠮟` ocupa dos unidades de UTF-16 pero es un carácter. */
export const kanjiCharacterSchema = z.string().regex(/^\p{Script=Han}$/u);
