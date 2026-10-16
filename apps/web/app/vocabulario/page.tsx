import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { VocabularyHome } from '@/sections/vocabulary/views/vocabulary-home';

export const metadata: Metadata = { title: 'Vocabulario' };

export default function VocabularyPage(): ReactNode {
  return <VocabularyHome />;
}
