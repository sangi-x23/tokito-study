import type { TopicDetail, TopicNode } from '@tokito/shared';
import { get } from '@/lib/api-client';

export async function getTopicTree(): Promise<TopicNode[]> {
  return (await get<TopicNode[]>('/topics')) ?? [];
}

export function getTopic(slug: string): Promise<TopicDetail | null> {
  return get<TopicDetail>(`/topics/${encodeURIComponent(slug)}`);
}
