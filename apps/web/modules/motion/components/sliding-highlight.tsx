'use client';

import { animate, createScope, utils, type AnimationParams, type Scope } from 'animejs';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

const DURATION_MS = 350;

/**
 * Resalta el enlace activo (`aria-current="page"`) de una lista con un fondo
 * que se desliza de una selección a la siguiente al navegar.
 *
 * El fondo es un hermano absoluto de la lista dentro del contenedor, que es
 * también el que hace scroll: en una fila horizontal se desplaza con los
 * enlaces. Hasta que se coloca por primera vez (antes de hidratar), el enlace
 * activo pinta su propio fondo; el contenedor lo apaga con `data-highlight`.
 *
 * Con `prefers-reduced-motion` el fondo salta sin animarse.
 */
export function SlidingHighlight({
  className = '',
  highlightClassName,
  children,
}: {
  className?: string;
  highlightClassName: string;
  children: ReactNode;
}): ReactNode {
  const root = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLDivElement>(null);
  const scope = useRef<Scope | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // El constructor vuelve a correr si cambia la preferencia de movimiento:
    // Anime.js revierte los estilos y el fondo se recoloca sin animar.
    scope.current = createScope({
      root,
      mediaQueries: { reduceMotion: '(prefers-reduced-motion: reduce)' },
    }).add((self) => {
      const container = root.current;
      const pill = highlight.current;
      if (!self || !container || !pill) {
        return;
      }
      let visible = false;

      const place = (instant: boolean): void => {
        // Lo instantáneo va con `utils.set`, que aplica en el acto: `animate`
        // espera al siguiente frame, y con la pestaña oculta no llega ninguno.
        const to = (params: AnimationParams): void => {
          if (instant || self.matches.reduceMotion) {
            utils.set(pill, params);
          } else {
            animate(pill, { ...params, duration: DURATION_MS, ease: 'outQuart' });
          }
        };

        const active = container.querySelector<HTMLElement>('[aria-current="page"]');
        if (!active) {
          visible = false;
          to({ opacity: 0 });
          return;
        }

        const box = active.getBoundingClientRect();
        const frame = container.getBoundingClientRect();
        const position = {
          x: box.left - frame.left + container.scrollLeft,
          y: box.top - frame.top + container.scrollTop,
          width: box.width,
          height: box.height,
        };

        if (visible) {
          to(position);
        } else {
          // Si no había selección, aparece en su sitio en vez de deslizarse
          // desde la última posición.
          utils.set(pill, position);
          to({ opacity: 1 });
          visible = true;
        }
        container.dataset.highlight = '';
      };

      self.add('place', place);
      place(true);
    });

    // Un cambio de tamaño (rotar el teléfono, cruzar el breakpoint de la fila
    // a la columna) mueve los enlaces sin navegar.
    const observer = new ResizeObserver(() => scope.current?.methods.place?.(true));
    if (root.current) {
      observer.observe(root.current);
    }

    return () => {
      observer.disconnect();
      scope.current?.revert();
    };
  }, []);

  useEffect(() => {
    scope.current?.methods.place?.(false);
  }, [pathname]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <div
        ref={highlight}
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 opacity-0 ${highlightClassName}`}
      />
      {children}
    </div>
  );
}
