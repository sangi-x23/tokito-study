import type { ReactNode } from 'react';
import type { SectionIcon as SectionIconName } from '@/lib/sections';

// Íconos SVG en línea, con trazo del color del texto: así no hace falta
// una librería de íconos para un puñado de dibujos.
const PATHS: Record<SectionIconName, ReactNode> = {
  diary: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 21a2 2 0 0 1 2-2h12v2H6" />
      <path d="M8 7h6M8 11h4" />
    </>
  ),
};

export function SectionIcon({ name, className }: { name: SectionIconName; className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
