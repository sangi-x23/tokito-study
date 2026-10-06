import type { TopicNode } from '@tokito/shared';
import type { ReactNode } from 'react';

/** Portada del Diario: una bienvenida mientras no se elige un tema. */
export function DiaryHome({ tree }: { tree: readonly TopicNode[] }): ReactNode {
  const subtopicCount = tree.reduce((total, topic) => total + topic.children.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Diario de clase</h1>
      <p className="text-slate-600 dark:text-slate-400">
        El material del curso, organizado por tema y no por clase. Elige un tema para ver sus subtemas.
      </p>
      {tree.length === 0 ? (
        <p className="text-slate-500">Todavía no hay temas.</p>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {tree.length} temas · {subtopicCount} subtemas
        </p>
      )}
    </div>
  );
}
