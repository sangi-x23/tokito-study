import type { TopicNode } from '@tokito/shared';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { TopicSidebar } from '../components/topic-sidebar';

/** El marco de todas las páginas del Diario: la barra de temas y el contenido. */
export function DiaryLayout({ tree, children }: { tree: readonly TopicNode[]; children: ReactNode }): ReactNode {
  return (
    <div className="lg:flex">
      <TopicSidebar tree={tree} />
      <div className="min-w-0 flex-1">
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
