import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { ScriptNav } from '../components/script-nav';

/** El marco de todas las páginas de Escritura: la barra de silabarios y el contenido. */
export function WritingLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="lg:flex">
      <ScriptNav />
      <div className="min-w-0 flex-1">
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
