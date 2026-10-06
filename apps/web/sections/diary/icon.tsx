import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';

export function DiaryIcon({ className }: { className?: string }): ReactNode {
  return (
    <Icon className={className}>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 21a2 2 0 0 1 2-2h12v2H6" />
      <path d="M8 7h6M8 11h4" />
    </Icon>
  );
}
