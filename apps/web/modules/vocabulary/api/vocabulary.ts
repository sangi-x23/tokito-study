import type { JlptLevel, VocabularyLevelList, VocabularyWord } from '@tokito/shared';
import { get } from '@/lib/api-client';

export function getVocabularyLevel(level: JlptLevel): Promise<VocabularyLevelList | null> {
  return get<VocabularyLevelList>(`/vocabulary/levels/${level}`);
}

export function getVocabularyWord(id: string): Promise<VocabularyWord | null> {
  return get<VocabularyWord>(`/vocabulary/words/${encodeURIComponent(id)}`);
}
