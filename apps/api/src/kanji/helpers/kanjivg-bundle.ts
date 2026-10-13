import { KANJIVG_TAG, parseStrokes } from '../../writing/helpers/kanjivg.js';

/**
 * El XML con todos los kanji del release de KanjiVG. Es el mismo tag que el
 * de los kana, y pesa unos 3,6 MB comprimido: una descarga en vez de una por
 * kanji.
 */
export function kanjiVgBundleUrl(tag: string = KANJIVG_TAG): string {
  return `https://github.com/KanjiVG/kanjivg/releases/download/${tag}/kanjivg-${tag.replace(/^r/u, '')}.xml.gz`;
}

// <kanji id="kvg:kanji_065e5"> … </kanji>; los trazos van dentro, igual que en
// el SVG suelto.
const KANJI_BLOCK = /<kanji id="kvg:kanji_([0-9a-f]+)">([\s\S]*?)<\/kanji>/gu;

/**
 * Los trazos de los caracteres pedidos, sacados del XML del release. Un
 * carácter que no está en el archivo no aparece en el resultado.
 */
export function parseKanjiVgBundle(xml: string, characters: Iterable<string>): Map<string, string[]> {
  const wanted = new Set(characters);
  const strokes = new Map<string, string[]>();

  for (const [, codePoint, block] of xml.matchAll(KANJI_BLOCK)) {
    const character = String.fromCodePoint(parseInt(codePoint!, 16));
    if (!wanted.has(character)) {
      continue;
    }
    try {
      strokes.set(character, parseStrokes(block!));
    } catch (error) {
      throw new Error(`Trazos inválidos para ${character}: ${error instanceof Error ? error.message : error}`);
    }
  }

  return strokes;
}
