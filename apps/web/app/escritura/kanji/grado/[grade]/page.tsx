import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getKanjiGrade } from '@/modules/kanji/api/kanji';
import { findGradeBySlug } from '@/modules/kanji/grades';
import { KanjiGradeView } from '@/sections/writing/views/kanji-grade-view';

export const dynamic = 'force-dynamic';

interface KanjiGradePageProps {
  params: Promise<{ grade: string }>;
}

export async function generateMetadata({ params }: KanjiGradePageProps): Promise<Metadata> {
  const grade = findGradeBySlug((await params).grade);
  return { title: grade ? `Kanji de ${grade.label.toLowerCase()}` : 'Grado no encontrado' };
}

export default async function KanjiGradePage({ params }: KanjiGradePageProps): Promise<ReactNode> {
  const grade = findGradeBySlug((await params).grade);
  const table = grade && (await getKanjiGrade(grade.grade));
  if (!grade || !table) {
    notFound();
  }
  return <KanjiGradeView grade={grade} table={table} />;
}
