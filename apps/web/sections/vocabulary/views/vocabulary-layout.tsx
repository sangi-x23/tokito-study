import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { LevelNav } from '../components/level-nav';

/** El marco de todas las páginas de Vocabulario: la barra de niveles y el contenido. */
export function VocabularyLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="lg:flex">
      <LevelNav />
      <div className="min-w-0 flex-1">
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
