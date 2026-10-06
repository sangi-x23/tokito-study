import type { ItemDetail } from '@tokito/shared';
import { get } from '@/lib/api-client';

export function getItem(id: string): Promise<ItemDetail | null> {
  return get<ItemDetail>(`/items/${encodeURIComponent(id)}`);
}
