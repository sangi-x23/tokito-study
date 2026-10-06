import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/lib/routes';
import { getTopicTree } from '@/modules/content/api/topics';
import { CATEGORY_LABEL, itemCountLabel } from '@/modules/content/labels';

// Se renderiza al pedirla, no en el build: así el build no necesita la API.
// Los datos igual se cachean una hora en `lib/api.ts`.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Diario de clase' };

export default async function HomePage(): Promise<ReactNode> {
  const tree = await getTopicTree();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Diario de clase</h1>
        <p className="text-slate-600 dark:text-slate-400">
          El material del curso, organizado por tema y no por clase.
        </p>
      </div>

      {tree.length === 0 ? (
        <p className="text-slate-500">Todavía no hay temas.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tree.map((topic) => (
            <li key={topic.slug} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <Link href={routes.topic(topic.slug)} className="text-lg font-medium hover:underline">
                  {topic.name}
                </Link>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {CATEGORY_LABEL[topic.category]}
                  {topic.itemCount > 0 && ` · ${itemCountLabel(topic.itemCount)}`}
                </span>
              </div>

              {topic.children.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm">
                  {topic.children.map((child) => (
                    <li key={child.slug} className="flex items-baseline justify-between gap-2">
                      <Link
                        href={routes.topic(child.slug)}
                        className="text-slate-700 hover:underline dark:text-slate-300"
                      >
                        {child.name}
                      </Link>
                      <span className="shrink-0 text-xs text-slate-400">{child.itemCount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
