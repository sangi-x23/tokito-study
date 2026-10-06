import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTopicTree } from '@/modules/content/api/topics';
import { DiaryHome } from '@/sections/diary/views/diary-home';

// Se renderiza al pedirla, no en el build: así el build no necesita la API.
// Los datos igual se cachean una hora en `lib/api-client.ts`.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Diario de clase' };

export default async function DiaryPage(): Promise<ReactNode> {
  return <DiaryHome tree={await getTopicTree()} />;
}
