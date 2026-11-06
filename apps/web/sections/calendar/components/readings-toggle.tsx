'use client';

import { type ReactNode, useState } from 'react';

/**
 * Muestra u oculta las lecturas en kana del calendario, para practicar
 * leyendo solo los kanji. `header` va antes del botón y `children`, después;
 * las lecturas de los dos responden al interruptor. El estado vive en memoria: al recargar vuelven a
 * verse.
 *
 * No re-renderiza el calendario: marca el contenedor con `data-readings` y cada
 * lectura se oculta con `READING_CLASS` (`../readings.ts`).
 * `invisible` y no `hidden`, para que las celdas no cambien de tamaño.
 */
export function ReadingsToggle({ header, children }: { header: ReactNode; children: ReactNode }): ReactNode {
  const [show, setShow] = useState(true);

  return (
    <div data-readings={show ? 'on' : 'off'} className="group/readings flex flex-col gap-6">
      {header}
      <button
        type="button"
        aria-pressed={!show}
        onClick={() => setShow((value) => !value)}
        className="self-start rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        {show ? 'Ocultar lecturas' : 'Mostrar lecturas'}
      </button>
      {children}
    </div>
  );
}
