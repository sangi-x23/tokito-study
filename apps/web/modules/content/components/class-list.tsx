import type { ClassRef } from '@tokito/shared';
import type { ReactNode } from 'react';

/** Las clases donde apareció un ítem. El título de la pestaña ya trae la fecha. */
export function ClassList({ classes }: { classes: readonly ClassRef[] }): ReactNode {
  if (classes.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {classes.map((entry) => (
        <li
          key={`${entry.classDate ?? ''}${entry.title}`}
          lang="ja"
          className="rounded-md bg-surface-strong px-2 py-0.5 text-xs text-ink-soft"
        >
          {entry.title}
        </li>
      ))}
    </ul>
  );
}
