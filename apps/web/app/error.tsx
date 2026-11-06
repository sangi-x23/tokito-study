'use client';

import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';

// Next exige que el límite de error sea un componente de cliente.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }): ReactNode {
  return (
    <PageContainer>
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Algo salió mal</h1>
        <p className="text-ink-muted">
          No se pudo cargar el material. Puede que la API no esté disponible.
        </p>
        <button type="button" onClick={reset} className="rounded-lg border border-line-strong px-4 py-2 text-sm">
          Reintentar
        </button>
      </div>
    </PageContainer>
  );
}
