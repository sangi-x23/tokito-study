import type { JlptLevel } from '@tokito/shared';
import type { WallerWord } from '../types/vocabulary.js';

// Listas del JLPT de Jonathan Waller (CC BY), con el ID de JMdict de cada
// palabra y las grafías raras cambiadas por las usuales, de
// stephenmk/yomitan-jlpt-vocab (CC BY-SA 4.0). No son oficiales: el JLPT no
// publica listas desde 2010. Commit fijado para que el seed sea reproducible.
export const WALLER_COMMIT = 'b062d4e38c4bdd0950ae1d4ec55f04b176182e03';

export const JLPT_LEVELS: readonly JlptLevel[] = [5, 4, 3, 2, 1];

export const wallerUrl = (level: JlptLevel, commit: string = WALLER_COMMIT): string =>
  `https://raw.githubusercontent.com/stephenmk/yomitan-jlpt-vocab/${commit}/original_data/n${level}.csv`;

/**
 * Aplica las correcciones (`WALLER_CORRECTIONS`): cambia la entrada de JMdict
 * o la grafía de las filas que las tienen.
 */
export function correctWallerWords(
  words: readonly WallerWord[],
  corrections: Readonly<Record<string, { readonly seq?: number; readonly kanji?: string }>>,
): WallerWord[] {
  return words.map((word) => {
    const correction = corrections[`${word.kanji || word.kana}|${word.kana}`];
    return correction ? { ...word, ...correction } : word;
  });
}

/** Divide una línea de CSV respetando las comillas (`"to meet,to encounter"`). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

/** Las palabras de una lista (`jmdict_seq,kana,kanji,waller_definition`), en su orden. */
export function parseWallerCsv(csv: string, level: JlptLevel): WallerWord[] {
  const [header, ...lines] = csv.split(/\r?\n/u).filter((line) => line.trim() !== '');
  if (!header?.startsWith('jmdict_seq,kana,kanji')) {
    throw new Error(`La lista N${level} no tiene la cabecera esperada: ${header ?? '(vacía)'}`);
  }
  return lines.flatMap((line) => {
    const [seq, kana, kanji] = splitCsvLine(line);
    // Unas pocas filas de N1 son la lectura on de un kanji suelto (`,い,依`),
    // no una palabra: no tienen entrada en JMdict y se saltan.
    if (seq === '') {
      return [];
    }
    if (!seq || !/^\d+$/u.test(seq) || !kana) {
      throw new Error(`Fila inválida en la lista N${level}: ${line}`);
    }
    return [{ level, seq: Number(seq), kana: kana.trim(), kanji: (kanji ?? '').trim() }];
  });
}
