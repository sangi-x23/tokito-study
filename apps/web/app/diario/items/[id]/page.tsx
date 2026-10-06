import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getItem } from '@/modules/content/api/items';
import { ItemView } from '@/sections/diary/views/item-view';

export const dynamic = 'force-dynamic';

interface ItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const item = await getItem((await params).id);
  return { title: item?.japanese ?? 'Ítem no encontrado' };
}

export default async function ItemPage({ params }: ItemPageProps): Promise<ReactNode> {
  const item = await getItem((await params).id);
  if (!item) {
    notFound();
  }
  return <ItemView item={item} />;
}
