'use client';

import type { KanjiDetail } from '@tokito/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal } from '@/components/modal';
import { routes } from '@/lib/routes';
import { KanjiDetails } from './kanji-details';

type KanjiState = { status: 'loading' } | { status: 'ready'; kanji: KanjiDetail } | { status: 'error'; message: string };

/**
 * El modal de un kanji, sin URL propia, como el de un kana. Se abre al
 * instante con el carácter y pide el detalle a `routes.kanjiData`: la
 * cuadrícula de un grado no trae trazos, y el navegador no puede llamar a la
 * API. El kanji abierto vive solo en memoria.
 */
export function KanjiDialog({ character, onClose }: { character: string; onClose: () => void }): ReactNode {
  const [state, setState] = useState<KanjiState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch(routes.kanjiData(character), { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) {
          setState({ status: 'error', message: 'Este kanji no está en el catálogo jōyō.' });
          return;
        }
        if (!response.ok) {
          throw new Error(`Respuesta ${response.status}`);
        }
        setState({ status: 'ready', kanji: (await response.json()) as KanjiDetail });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', message: 'No se pudo cargar el kanji. Inténtalo de nuevo.' });
        }
      });
    return () => controller.abort();
  }, [character]);

  return (
    <Modal
      onClose={onClose}
      title={
        <span lang="ja" className="text-5xl font-medium">
          {character}
        </span>
      }
    >
      {state.status === 'loading' && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>}
      {state.status === 'error' && <p className="text-sm text-slate-500 dark:text-slate-400">{state.message}</p>}
      {state.status === 'ready' && <KanjiDetails kanji={state.kanji} />}
    </Modal>
  );
}
