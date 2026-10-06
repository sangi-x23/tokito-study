import type { ItemSummary } from '@tokito/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/lib/routes';
import { ClassList } from './class-list';
import { TypeBadge } from './type-badge';

/**
 * Un ítem dentro de la página de un tema. `currentSlug` es el tema que se
 * está viendo: si el primario es otro, se avisa de dónde vive el ítem.
 */
export function ItemCard({ item, currentSlug }: { item: ItemSummary; currentSlug: string }): ReactNode {
  const elsewhere = item.primaryTopic && item.primaryTopic.slug !== currentSlug ? item.primaryTopic : null;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <Link href={routes.item(item.id)} className="group">
          <span lang="ja" className="text-2xl font-medium group-hover:underline">
            {item.japanese}
          </span>
          {item.reading && (
            <span lang="ja" className="ml-2 text-sm text-slate-500 dark:text-slate-400">
              {item.reading}
            </span>
          )}
        </Link>
        <TypeBadge type={item.type} />
      </div>

      <p>{item.meaning}</p>

      {item.kanji && (
        <p lang="ja" className="text-sm text-slate-600 dark:text-slate-300">
          {[...item.kanji.onyomi, ...item.kanji.kunyomi].join('・')}
        </p>
      )}

      {item.example && (
        <p lang="ja" className="text-sm text-slate-500 dark:text-slate-400">
          {item.example}
        </p>
      )}

      <ClassList classes={item.classes} />

      {elsewhere && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tema principal:{' '}
          <Link href={routes.topic(elsewhere.slug)} className="underline hover:text-slate-900 dark:hover:text-slate-100">
            {elsewhere.name}
          </Link>
        </p>
      )}
    </li>
  );
}
