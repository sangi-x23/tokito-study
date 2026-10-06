import type { TopicSummaryRow } from '../helpers/to-dto';

export interface TopicTreeRow extends TopicSummaryRow {
  readonly id: string;
  readonly parentId: string | null;
  readonly position: number;
}
