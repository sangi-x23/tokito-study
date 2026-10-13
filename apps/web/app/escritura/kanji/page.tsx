import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { KanjiHomeView } from '@/sections/writing/views/kanji-home-view';

export const metadata: Metadata = { title: 'Kanji' };

export default function KanjiPage(): ReactNode {
  return <KanjiHomeView />;
}
