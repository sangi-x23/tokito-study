import type { ReactNode } from 'react';

/** El ancho y los márgenes del contenido de una página. Cada sección decide dónde ponerlo. */
export function PageContainer({ children }: { children: ReactNode }): ReactNode {
  return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>;
}
