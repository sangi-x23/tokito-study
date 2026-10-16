import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getVocabularyLevel } from '@/modules/vocabulary/api/vocabulary';
import { findLevelBySlug } from '@/modules/vocabulary/levels';
import { LevelView } from '@/sections/vocabulary/views/level-view';

export const dynamic = 'force-dynamic';

interface LevelPageProps {
  params: Promise<{ level: string }>;
}

export async function generateMetadata({ params }: LevelPageProps): Promise<Metadata> {
  const level = findLevelBySlug((await params).level);
  return { title: level ? `Vocabulario ${level.label}` : 'Nivel no encontrado' };
}

export default async function LevelPage({ params }: LevelPageProps): Promise<ReactNode> {
  const level = findLevelBySlug((await params).level);
  const list = level && (await getVocabularyLevel(level.level));
  if (!level || !list) {
    notFound();
  }
  return <LevelView level={level} list={list} />;
}
