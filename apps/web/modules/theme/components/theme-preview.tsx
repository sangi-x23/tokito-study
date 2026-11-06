'use client';

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

/** Lo que el aviso de vista previa necesita mostrar de un día temático. */
export interface PreviewTheme {
  readonly slug: string;
  readonly japanese: string;
  readonly spanish: string;
}

const ThemePreviewContext = createContext<((theme: PreviewTheme | null) => void) | null>(null);

/**
 * Permite ver el tema de cualquier día sin esperar a la fecha. Vive en el
 * layout raíz, que no se desmonta al navegar, así que la vista previa se
 * mantiene en todo el sitio hasta quitarla o recargar: el estado es solo de
 * memoria.
 *
 * Cambia `data-theme` del `<html>` directamente. React no lo pisa al navegar:
 * solo toca el atributo si cambia el valor que manda el servidor, y ese es el
 * mismo todo el día. Al quitar la vista previa vuelve `serverTheme`.
 */
export function ThemePreviewProvider({
  serverTheme,
  children,
}: {
  serverTheme: string | null;
  children: ReactNode;
}): ReactNode {
  const [preview, setPreview] = useState<PreviewTheme | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const theme = preview?.slug ?? serverTheme;
    if (theme) {
      root.dataset.theme = theme;
    } else {
      delete root.dataset.theme;
    }
  }, [preview, serverTheme]);

  return (
    <ThemePreviewContext value={setPreview}>
      {children}
      {preview && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-xl"
        >
          <span className="flex-1">
            Vista previa del tema de <span lang="ja">{preview.japanese}</span>
            <span className="text-ink-subtle"> · {preview.spanish}</span>
          </span>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="rounded-md px-2 py-1 font-medium text-accent-ink hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-accent"
          >
            Quitar
          </button>
        </div>
      )}
    </ThemePreviewContext>
  );
}

/** Botón que activa la vista previa del tema de un día. */
export function ThemePreviewButton({ theme }: { theme: PreviewTheme }): ReactNode {
  const setPreview = useContext(ThemePreviewContext);
  if (!setPreview) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={() => setPreview(theme)}
      className="rounded-md border border-line-strong px-2 py-0.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
    >
      Ver tema
    </button>
  );
}
