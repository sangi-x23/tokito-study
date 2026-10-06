import type { TopicNode } from '@tokito/shared';
import type { TopicTreeRow } from '../types/topic-tree.js';
import { toTopicSummary } from './to-dto.js';

const byPosition = (a: TopicTreeRow, b: TopicTreeRow): number =>
  a.position - b.position || a.name.localeCompare(b.name, 'es');

/**
 * Arma el árbol de dos niveles a partir de la lista plana de temas. Un
 * subtema cuyo padre no está en la lista se descarta: no tiene dónde colgar.
 */
export function buildTopicTree(rows: readonly TopicTreeRow[]): TopicNode[] {
  const children = new Map<string, TopicTreeRow[]>();
  for (const row of rows) {
    if (row.parentId !== null) {
      children.set(row.parentId, [...(children.get(row.parentId) ?? []), row]);
    }
  }

  return rows
    .filter((row) => row.parentId === null)
    .sort(byPosition)
    .map((root) => ({
      ...toTopicSummary(root),
      children: (children.get(root.id) ?? []).sort(byPosition).map(toTopicSummary),
    }));
}
