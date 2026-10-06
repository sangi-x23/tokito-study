import type { ReactNode } from 'react';
import { getTopicTree } from '@/modules/content/api/topics';
import { DiaryLayout } from '@/sections/diary/views/diary-layout';

// El layout no se vuelve a renderizar al navegar dentro del Diario, así que la
// barra de temas se pide una vez. La portada también pide el árbol, pero Next
// reutiliza la respuesta de este `fetch`.
export default async function Layout({ children }: { children: ReactNode }): Promise<ReactNode> {
  return <DiaryLayout tree={await getTopicTree()}>{children}</DiaryLayout>;
}
