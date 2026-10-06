import type { ComponentType } from 'react';

/** Una entrada del sidebar. Cada sección declara la suya en `<sección>/section.ts`. */
export interface AppSection {
  readonly label: string;
  readonly href: string;
  readonly Icon: ComponentType<{ className?: string }>;
}
