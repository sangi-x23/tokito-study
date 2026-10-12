'use client';

import { createScope, createTimeline, svg, utils, type Scope } from 'animejs';
import { useEffect, useRef, type ReactNode } from 'react';

// El lienzo de los trazos de KanjiVG.
const VIEWBOX = '0 0 109 109';
const GAP_MS = 150;
const MS_PER_UNIT = 7;
const MIN_STROKE_MS = 300;

/** Dónde empieza un trazo: el primer punto de su path (`M31.01,33…`). */
function strokeStart(d: string): { x: number; y: number } {
  const match = /^\s*[Mm]\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/u.exec(d);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
}

/** Cruz punteada del papel de práctica, para ubicar el trazo en el cuadro. */
function Guides(): ReactNode {
  return (
    <g className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth={0.5} strokeDasharray="2 2">
      <line x1={54.5} y1={0} x2={54.5} y2={109} />
      <line x1={0} y1={54.5} x2={109} y2={54.5} />
    </g>
  );
}

const STROKE_PROPS = { fill: 'none', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/**
 * El orden de trazos de un carácter: uno grande que se dibuja trazo a trazo,
 * con el número de cada trazo junto a su inicio, y debajo la secuencia paso a
 * paso con el trazo nuevo resaltado.
 *
 * Con `prefers-reduced-motion` el grande aparece completo, sin animarse.
 */
export function StrokeOrder({ strokes }: { strokes: readonly string[] }): ReactNode {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<Scope | null>(null);

  useEffect(() => {
    scope.current = createScope({
      root,
      mediaQueries: { reduceMotion: '(prefers-reduced-motion: reduce)' },
    }).add((self) => {
      if (!self || !root.current) {
        return;
      }
      const paths = [...root.current.querySelectorAll<SVGPathElement>('[data-animated-stroke]')];
      const drawables = svg.createDrawable(paths);

      if (self.matches.reduceMotion) {
        utils.set(drawables, { draw: '0 1' });
        return;
      }

      utils.set(drawables, { draw: '0 0' });
      const timeline = createTimeline();
      drawables.forEach((drawable, index) => {
        timeline.add(drawable, {
          draw: ['0 0', '0 1'],
          duration: Math.max(MIN_STROKE_MS, drawable.getTotalLength() * MS_PER_UNIT),
          delay: index === 0 ? 0 : GAP_MS,
          ease: 'inOutSine',
        });
      });
      self.add('replay', () => timeline.restart());
    });

    return () => scope.current?.revert();
  }, [strokes]);

  return (
    <div ref={root} className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <svg viewBox={VIEWBOX} aria-hidden className="size-44 rounded-xl border border-slate-200 dark:border-slate-800">
          <Guides />
          <g className="text-slate-200 dark:text-slate-800" stroke="currentColor" {...STROKE_PROPS}>
            {strokes.map((d, index) => (
              <path key={index} d={d} />
            ))}
          </g>
          <g className="text-slate-900 dark:text-slate-100" stroke="currentColor" {...STROKE_PROPS}>
            {strokes.map((d, index) => (
              <path key={index} d={d} data-animated-stroke />
            ))}
          </g>
          <g className="fill-slate-400 dark:fill-slate-500" fontSize={7}>
            {strokes.map((d, index) => {
              const start = strokeStart(d);
              return (
                <text key={index} x={Math.max(1, start.x - 7)} y={Math.max(7, start.y - 1)}>
                  {index + 1}
                </text>
              );
            })}
          </g>
        </svg>
        {/* Sin animación (prefers-reduced-motion) no hay nada que repetir. */}
        <button
          type="button"
          onClick={() => scope.current?.methods.replay?.()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 motion-reduce:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Repetir animación
        </button>
      </div>

      <ol className="flex flex-wrap justify-center gap-2" aria-label="Paso a paso">
        {strokes.map((_, step) => (
          <li key={step} className="flex flex-col items-center gap-1">
            <svg viewBox={VIEWBOX} aria-hidden className="size-14 rounded-lg border border-slate-200 dark:border-slate-800">
              <Guides />
              {strokes.slice(0, step + 1).map((d, index) => (
                <path
                  key={index}
                  d={d}
                  stroke="currentColor"
                  {...STROKE_PROPS}
                  className={
                    index === step ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                  }
                />
              ))}
            </svg>
            <span className="text-xs text-slate-500 dark:text-slate-400">{step + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
