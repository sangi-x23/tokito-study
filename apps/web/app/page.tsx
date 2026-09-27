import type { ReactNode } from 'react';

export default function HomePage(): ReactNode {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Tokito</h1>
      <p className="text-lg text-slate-600">
        Material de estudio de japonés organizado por temas.
      </p>
      <p className="text-sm text-slate-400">
        Esqueleto del proyecto (Fase 0). La navegación por temas llega en la Fase 7.
      </p>
    </main>
  );
}
