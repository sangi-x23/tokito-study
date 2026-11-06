import type { ReactNode } from 'react';

/** Las licencias de JMdict, Tatoeba y las listas de Waller piden citarlos. */
export function VocabularyCredits(): ReactNode {
  const link = 'underline hover:text-ink';
  return (
    <p className="text-xs text-ink-subtle">
      Palabras y acepciones de{' '}
      <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" target="_blank" rel="noreferrer" className={link}>
        JMdict
      </a>
      , propiedad del{' '}
      <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noreferrer" className={link}>
        Electronic Dictionary Research and Development Group
      </a>{' '}
      (CC BY-SA 4.0); el español es una traducción nuestra de su inglés. Niveles de las listas de{' '}
      <a href="https://www.tanos.co.uk/jlpt/" target="_blank" rel="noreferrer" className={link}>
        Jonathan Waller
      </a>{' '}
      (CC BY), con las grafías de{' '}
      <a href="https://github.com/stephenmk/yomitan-jlpt-vocab" target="_blank" rel="noreferrer" className={link}>
        yomitan-jlpt-vocab
      </a>{' '}
      (CC BY-SA 4.0). Ejemplos de{' '}
      <a href="https://tatoeba.org" target="_blank" rel="noreferrer" className={link}>
        Tatoeba
      </a>{' '}
      (CC BY 2.0 FR).
    </p>
  );
}
