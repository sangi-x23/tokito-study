'use client';

import type { VocabularySummary, VocabularyWord } from '@tokito/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal } from '@/components/modal';
import { routes } from '@/lib/routes';
import { VocabularyDetails, VocabularyFacts } from './vocabulary-details';

type WordState = { status: 'loading' } | { status: 'ready'; word: VocabularyWord } | { status: 'error'; message: string };

/**
 * El modal de una palabra, sin URL propia, como el de un kanji. Se abre al
 * instante con lo que ya trae la lista y pide el significado y los ejemplos
 * a `routes.vocabularyData`. La palabra abierta vive solo en memoria.
 */
export function VocabularyDialog({ word, onClose }: { word: VocabularySummary; onClose: () => void }): ReactNode {
  const [state, setState] = useState<WordState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch(routes.vocabularyData(word.id), { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) {
          setState({ status: 'error', message: 'Esta palabra ya no está en el vocabulario.' });
          return;
        }
        if (!response.ok) {
          throw new Error(`Respuesta ${response.status}`);
        }
        setState({ status: 'ready', word: (await response.json()) as VocabularyWord });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', message: 'No se pudo cargar la palabra. Inténtalo de nuevo.' });
        }
      });
    return () => controller.abort();
  }, [word.id]);

  return (
    <Modal
      onClose={onClose}
      title={
        <>
          <span lang="ja" className="text-4xl font-medium">
            {word.japanese}
          </span>
          {word.reading !== word.japanese && (
            <span lang="ja" className="text-xl text-slate-500 dark:text-slate-400">
              {word.reading}
            </span>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <p className="text-lg">{word.equivalents.join(', ')}</p>
        {state.status === 'ready' && <VocabularyFacts word={state.word} />}
      </div>
      {state.status === 'loading' && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>}
      {state.status === 'error' && <p className="text-sm text-slate-500 dark:text-slate-400">{state.message}</p>}
      {state.status === 'ready' && <VocabularyDetails word={state.word} />}
    </Modal>
  );
}
