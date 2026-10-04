import Link from 'next/link';
import type { ReactNode } from 'react';

export default function NotFound(): ReactNode {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">No encontrado</h1>
      <p className="text-slate-600 dark:text-slate-400">Ese tema o ítem no existe.</p>
      <Link href="/" className="underline">
        Volver a los temas
      </Link>
    </div>
  );
}
