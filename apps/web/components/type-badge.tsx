import type { ItemType } from '@tokito/shared';
import type { ReactNode } from 'react';
import { ITEM_TYPE_LABEL, ITEM_TYPE_STYLE } from '@/lib/labels';

export function TypeBadge({ type }: { type: ItemType }): ReactNode {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ITEM_TYPE_STYLE[type]}`}>
      {ITEM_TYPE_LABEL[type]}
    </span>
  );
}
