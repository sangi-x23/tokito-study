import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';

/** Una hoja de calendario. */
export function CalendarIcon({ className }: { className?: string }): ReactNode {
  return (
    <Icon className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  );
}
