import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { WritingHome } from '@/sections/writing/views/writing-home';

export const metadata: Metadata = { title: 'Escritura' };

export default function WritingPage(): ReactNode {
  return <WritingHome />;
}
