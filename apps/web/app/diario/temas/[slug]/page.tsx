import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getTopic } from '@/modules/content/api/topics';
import { TopicView } from '@/sections/diary/views/topic-view';

export const dynamic = 'force-dynamic';

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const topic = await getTopic((await params).slug);
  return { title: topic?.name ?? 'Tema no encontrado' };
}

export default async function TopicPage({ params }: TopicPageProps): Promise<ReactNode> {
  const topic = await getTopic((await params).slug);
  if (!topic) {
    notFound();
  }
  return <TopicView topic={topic} />;
}
