import type { ItemSummary } from '@tokito/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LinkPendingHint } from '@/components/layout/link-pending-hint';
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
    <li className="flex flex-col gap-2 rounded-xl border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={routes.item(item.id)} className="group">
          <span lang="ja" className="text-2xl font-medium group-hover:underline">
            {item.japanese}
          </span>
          {item.reading && (
            <span lang="ja" className="ml-2 text-sm text-ink-subtle">
              {item.reading}
            </span>
          )}
          <LinkPendingHint className="ml-2 inline-block align-middle" />
        </Link>
        <TypeBadge type={item.type} />
      </div>

      <p>{item.meaning}</p>

      {item.kanji && (
        <p lang="ja" className="text-sm text-ink-soft">
          {[...item.kanji.onyomi, ...item.kanji.kunyomi].join('・')}
        </p>
      )}

      {item.example && (
        <p lang="ja" className="text-sm text-ink-subtle">
          {item.example}
        </p>
      )}

      <ClassList classes={item.classes} />

      {elsewhere && (
        <p className="text-xs text-ink-subtle">
          Tema principal:{''}
          <Link href={routes.topic(elsewhere.slug)} className="underline hover:text-ink">
            {elsewhere.name}
          </Link>
        </p>
      )}
    </li>
  );
}
