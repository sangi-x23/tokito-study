import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';

export function WritingIcon({ className }: { className?: string }): ReactNode {
  return (
    <Icon className={className}>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      <path d="M13 21h8" />
    </Icon>
  );
}
