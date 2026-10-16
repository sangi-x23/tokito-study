import type { ReactNode } from 'react';
import { VocabularyLayout } from '@/sections/vocabulary/views/vocabulary-layout';

export default function Layout({ children }: { children: ReactNode }): ReactNode {
  return <VocabularyLayout>{children}</VocabularyLayout>;
}
