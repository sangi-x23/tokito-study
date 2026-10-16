import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';

/** Un libro abierto: el diccionario. */
export function VocabularyIcon({ className }: { className?: string }): ReactNode {
  return (
    <Icon className={className}>
      <path d="M12 6.5C10.5 5 8 4.5 3 4.5v14c5 0 7.5.5 9 2 1.5-1.5 4-2 9-2v-14c-5 0-7.5.5-9 2Z" />
      <path d="M12 6.5v14" />
    </Icon>
  );
}
