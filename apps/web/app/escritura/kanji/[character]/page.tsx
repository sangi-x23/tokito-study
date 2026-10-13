import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getKanji } from '@/modules/kanji/api/kanji';
import { KanjiView } from '@/sections/writing/views/kanji-view';

export const dynamic = 'force-dynamic';

interface KanjiPageProps {
  params: Promise<{ character: string }>;
}

/**
 * El kanji llega en la URL codificado (`%E6%97%A5`). Se decodifica sin fiarse
 * de si Next ya lo hizo: decodificar un kanji no lo cambia, y una secuencia
 * `%` inválida se deja como está para que la API responda 400.
 */
async function characterFrom(params: KanjiPageProps['params']): Promise<string> {
  const raw = (await params).character;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: KanjiPageProps): Promise<Metadata> {
  const kanji = await getKanji(await characterFrom(params));
  return { title: kanji ? `${kanji.character} · Kanji` : 'Kanji no encontrado' };
}

export default async function KanjiDetailPage({ params }: KanjiPageProps): Promise<ReactNode> {
  const kanji = await getKanji(await characterFrom(params));
  if (!kanji) {
    notFound();
  }
  return <KanjiView kanji={kanji} />;
}
