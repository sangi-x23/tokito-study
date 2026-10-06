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
          {CATEGORY_LABEL[topic.category]} · {itemCountLabel(topic.itemCount)}
        </p>
        {topic.description && <p className="text-slate-600 dark:text-slate-400">{topic.description}</p>}
      </div>

      {topic.children.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Subtemas</h2>
          <ul className="flex flex-wrap gap-2">
            {topic.children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={routes.topic(child.slug)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  {child.name}
                  <span className="text-xs text-slate-400">{child.itemCount}</span>
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
