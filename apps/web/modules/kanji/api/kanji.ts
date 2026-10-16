import type { KanjiDetail, KanjiGrade, KanjiGradeTable } from '@tokito/shared';
import { CATALOG_REVALIDATE_SECONDS, get } from '@/lib/api-client';

export function getKanjiGrade(grade: KanjiGrade): Promise<KanjiGradeTable | null> {
  return get<KanjiGradeTable>(`/kanji/grades/${grade}`, CATALOG_REVALIDATE_SECONDS);
}

export function getKanji(character: string): Promise<KanjiDetail | null> {
  return get<KanjiDetail>(`/kanji/${encodeURIComponent(character)}`, CATALOG_REVALIDATE_SECONDS);
}
