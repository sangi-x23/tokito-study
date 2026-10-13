'use client';

import { useState, type ReactNode } from 'react';
import { KanjiDialog } from './kanji-dialog';

/** Un botón suelto que abre el modal de un kanji, para las secciones que no tienen cuadrícula. */
export function KanjiDialogButton({
  character,
  className,
  children,
}: {
  character: string;
  className?: string;
  children: ReactNode;
}): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <KanjiDialog character={character} onClose={() => setOpen(false)} />}
    </>
  );
}
