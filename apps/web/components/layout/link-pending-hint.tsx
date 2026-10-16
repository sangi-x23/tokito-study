'use client';

import { useLinkStatus } from 'next/link';
import type { ReactNode } from 'react';

/**
 * Un círculo que gira junto a un `<Link>` mientras su página carga. Las
 * páginas son dinámicas y sin `loading.tsx`, así que la navegación espera la
 * respuesta del servidor: sin esto, el clic no muestra nada y parece que la
 * app se trabó. Aparece solo si la espera pasa de 120 ms, y ocupa su lugar
 * aunque no se vea, para no mover el texto.
 *
 * Va dentro del `<Link>`: `useLinkStatus` lee el estado del enlace que lo
 * contiene.
 */
export function LinkPendingHint({ className = '' }: { className?: string }): ReactNode {
  const { pending } = useLinkStatus();

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden
      className={`size-4 shrink-0 text-slate-400 ${
        pending ? 'animate-link-pending motion-reduce:animate-link-pending-reduced' : 'invisible'
      } ${className}`}
    >
      <circle cx="12" cy="12" r="9" strokeOpacity={0.3} />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
