import type { KanaTable } from '@tokito/shared';
import { CATALOG_REVALIDATE_SECONDS, get } from '@/lib/api-client';

/** `script` va como en la URL: `hiragana` o `katakana`. */
export function getKanaTable(script: string): Promise<KanaTable | null> {
  return get<KanaTable>(`/kana/${encodeURIComponent(script)}`, CATALOG_REVALIDATE_SECONDS);
}
