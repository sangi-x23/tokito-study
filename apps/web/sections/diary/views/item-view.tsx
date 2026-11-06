import type { ItemDetail } from '@tokito/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb, type Crumb } from '@/components/breadcrumb';
import { routes } from '@/lib/routes';
import { ClassList } from '@/modules/content/components/class-list';
import { TypeBadge } from '@/modules/content/components/type-badge';
import { KanjiDialogButton } from '@/modules/kanji/components/kanji-dialog-button';
import { diarySection } from '../section';

function Panel({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">{title}</h2>
      {children}
    </section>
  );
}

function Readings({ label, readings }: { label: string; readings: readonly string[] }): ReactNode {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd lang="ja" className="text-lg">
        {readings.length > 0 ? readings.join('・') : '—'}
      </dd>
    </div>
  );
}

/** Un ítem: lecturas, ejemplo, palabras de un kanji, temas y clases. */
export function ItemView({ item }: { item: ItemDetail }): ReactNode {
  const crumbs: Crumb[] = [
    { label: diarySection.label, href: diarySection.href },
    ...(item.primaryTopic ? [{ label: item.primaryTopic.name, href: routes.topic(item.primaryTopic.slug) }] : []),
    { label: item.japanese },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumb crumbs={crumbs} />
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 lang="ja" className="text-5xl font-medium">
            {item.japanese}
          </h1>
          {item.reading && (
            <span lang="ja" className="text-xl text-ink-subtle">
              {item.reading}
            </span>
          )}
          <TypeBadge type={item.type} />
        </div>
        <p className="text-xl">{item.meaning}</p>
      </div>

      {item.kanji && (
        <Panel title="Kanji">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Readings label="On'yomi" readings={item.kanji.onyomi} />
            <Readings label="Kun'yomi" readings={item.kanji.kunyomi} />
            <div className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
              <dt className="text-xs text-ink-subtle">Trazos</dt>
              <dd className="text-lg">{item.kanji.strokeCount ?? '—'}</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
              <dt className="text-xs text-ink-subtle">JLPT</dt>
              <dd className="text-lg">{item.kanji.jlptLevel ? `N${item.kanji.jlptLevel}` : '—'}</dd>
            </div>
          </dl>
          {item.inKanjiCatalog && (
            <KanjiDialogButton
              character={item.japanese}
              className="cursor-pointer self-start text-sm text-accent-ink hover:underline"
            >
              Ver orden de trazos →
            </KanjiDialogButton>
          )}
        </Panel>
      )}

      {item.example && (
        <Panel title="Ejemplo">
          <p lang="ja" className="text-lg">
            {item.example}
          </p>
        </Panel>
      )}

      {item.relatedWords.length > 0 && (
        <Panel title="Palabras del curso con este kanji">
          <ul className="grid gap-2 sm:grid-cols-2">
            {item.relatedWords.map((word) => (
              <li key={word.id}>
                <Link
                  href={routes.item(word.id)}
                  className="flex items-baseline gap-2 rounded-lg border border-line px-3 py-2 hover:bg-surface-muted"
                >
                  <span lang="ja" className="text-lg">
                    {word.japanese}
                  </span>
                  {word.reading && (
                    <span lang="ja" className="text-sm text-ink-subtle">
                      {word.reading}
                    </span>
                  )}
                  <span className="ml-auto text-sm text-ink-soft">{word.meaning}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Temas">
        <ul className="flex flex-wrap gap-2">
          {item.topics.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={routes.topic(topic.slug)}
                className="inline-flex rounded-full border border-line px-3 py-1 text-sm hover:bg-surface-muted"
              >
                {topic.name}
                {topic.isPrimary && <span className="ml-1 text-ink-faint">· principal</span>}
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      {item.classes.length > 0 && (
        <Panel title="Visto en clase">
          <ClassList classes={item.classes} />
        </Panel>
      )}
    </div>
  );
}
