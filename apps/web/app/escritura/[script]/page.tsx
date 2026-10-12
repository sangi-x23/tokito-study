import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getKanaTable } from '@/modules/writing/api/kana';
import { findScript } from '@/sections/writing/scripts';
import { KanaTableView } from '@/sections/writing/views/kana-table-view';

export const dynamic = 'force-dynamic';

interface KanaTablePageProps {
  params: Promise<{ script: string }>;
}

export async function generateMetadata({ params }: KanaTablePageProps): Promise<Metadata> {
  return { title: findScript((await params).script)?.label ?? 'Silabario no encontrado' };
}

export default async function KanaTablePage({ params }: KanaTablePageProps): Promise<ReactNode> {
  const script = findScript((await params).script);
  const table = script && (await getKanaTable(script.slug));
  if (!script || !table) {
    notFound();
  }
  return <KanaTableView script={script} table={table} />;
}
