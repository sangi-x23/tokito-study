import type { TopicDetail } from '@tokito/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb, type Crumb } from '@/components/breadcrumb';
import { routes } from '@/lib/routes';
import { ItemCard } from '@/modules/content/components/item-card';
import { CATEGORY_LABEL, itemCountLabel } from '@/modules/content/labels';

/** Un tema: sus subtemas y sus ítems directos. */
export function TopicView({ topic }: { topic: TopicDetail }): ReactNode {
  const crumbs: Crumb[] = [
    ...(topic.parent ? [{ label: topic.parent.name, href: routes.topic(topic.parent.slug) }] : []),
    { label: topic.name },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Breadcrumb crumbs={crumbs} />
        <h1 className="text-3xl font-semibold tracking-tight">{topic.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {CATEGORY_LABEL[topic.category]} ·{' '}
          {/* Un tema raíz suele no tener ítems propios: los tienen sus subtemas. */}
          {topic.children.length > 0 && topic.itemCount === 0
            ? `${topic.children.length} subtemas`
            : itemCountLabel(topic.itemCount)}
        </p>
        {topic.description && <p className="text-slate-600 dark:text-slate-400">{topic.description}</p>}
      </div>

      {topic.children.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Subtemas</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {topic.children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={routes.topic(child.slug)}
                  className="flex h-full flex-col gap-1 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <span className="font-medium">{child.name}</span>
                  {child.description && (
                    <span className="text-sm text-slate-600 dark:text-slate-400">{child.description}</span>
                  )}
                  <span className="mt-auto pt-1 text-xs text-slate-500 dark:text-slate-400">
                    {itemCountLabel(child.itemCount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topic.items.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Ítems</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {topic.items.map((item) => (
              <ItemCard key={item.id} item={item} currentSlug={topic.slug} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
