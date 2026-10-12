import type { ReactNode } from 'react';
import { WritingLayout } from '@/sections/writing/views/writing-layout';

export default function Layout({ children }: { children: ReactNode }): ReactNode {
  return <WritingLayout>{children}</WritingLayout>;
}
