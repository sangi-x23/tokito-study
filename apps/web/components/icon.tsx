import type { ReactNode } from 'react';

// Íconos SVG en línea, con trazo del color del texto: así no hace falta una
// librería de íconos para un puñado de dibujos. Cada ícono pasa sus trazos
// como hijos sobre una grilla de 24×24.
export function Icon({ className, children }: { className?: string; children: ReactNode }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}
