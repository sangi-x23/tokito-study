import type { ReactNode } from 'react';

/** Las licencias de KanjiVG (trazos) y KANJIDIC2 (lecturas y significados) piden citarlos. */
export function KanjiCredits(): ReactNode {
  const link = 'underline hover:text-ink';
  return (
    <p className="text-xs text-ink-subtle">
      Trazos de{' '}
      <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer" className={link}>
        KanjiVG
      </a>{' '}
      (CC BY-SA 3.0). Lecturas y significados de{' '}
      <a href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project" target="_blank" rel="noreferrer" className={link}>
        KANJIDIC2
      </a>
      , propiedad del{' '}
      <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noreferrer" className={link}>
        Electronic Dictionary Research and Development Group
      </a>{' '}
      (CC BY-SA 4.0).
    </p>
  );
}
