import type { TopicSummaryRow } from '../helpers/to-dto.js';

export interface TopicTreeRow extends TopicSummaryRow {
  readonly id: string;
  readonly parentId: string | null;
  readonly position: number;
}
