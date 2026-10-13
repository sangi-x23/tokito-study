import type { KanjiDetail, KanjiGrade, KanjiGradeTable } from '@tokito/shared';
import { get } from '@/lib/api-client';

export function getKanjiGrade(grade: KanjiGrade): Promise<KanjiGradeTable | null> {
  return get<KanjiGradeTable>(`/kanji/grades/${grade}`);
}

export function getKanji(character: string): Promise<KanjiDetail | null> {
  return get<KanjiDetail>(`/kanji/${encodeURIComponent(character)}`);
}
