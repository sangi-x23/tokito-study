import type { ReactNode } from 'react';
import { WRITING_SCRIPTS } from '../scripts';

/** Portada de Escritura: una bienvenida mientras no se elige un sistema. */
export function WritingHome(): ReactNode {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Escritura</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Los silabarios del japonés con todas sus combinaciones (básicos, dakuten, handakuten, pequeños y combinados) y
        los kanji de uso común con su orden de trazos. Elige uno para empezar.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {[...WRITING_SCRIPTS.map((script) => script.label), 'Kanji'].join(' · ')}
      </p>
    </div>
  );
}
