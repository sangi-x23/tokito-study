import type { JlptLevel, VocabularyLevelList, VocabularyWord } from '@tokito/shared';
import { CATALOG_REVALIDATE_SECONDS, get } from '@/lib/api-client';

export function getVocabularyLevel(level: JlptLevel): Promise<VocabularyLevelList | null> {
  return get<VocabularyLevelList>(`/vocabulary/levels/${level}`, CATALOG_REVALIDATE_SECONDS);
}

export function getVocabularyWord(id: string): Promise<VocabularyWord | null> {
  return get<VocabularyWord>(`/vocabulary/words/${encodeURIComponent(id)}`, CATALOG_REVALIDATE_SECONDS);
}
