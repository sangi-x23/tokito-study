import type { VocabularySummary } from '@tokito/shared';

/** Las filas del silabario, en el orden de un diccionario japonés. */
export const KANA_ROWS = [
  { label: 'あ', kana: 'あいうえお' },
  { label: 'か', kana: 'かきくけこ' },
  { label: 'さ', kana: 'さしすせそ' },
  { label: 'た', kana: 'たちつてと' },
  { label: 'な', kana: 'なにぬねの' },
  { label: 'は', kana: 'はひふへほ' },
  { label: 'ま', kana: 'まみむめも' },
  { label: 'や', kana: 'やゆよ' },
  { label: 'ら', kana: 'らりるれろ' },
  { label: 'わ', kana: 'わゐゑをん' },
] as const;

export type KanaRow = (typeof KANA_ROWS)[number];

export interface KanaRowGroup {
  readonly row: KanaRow;
  /** Para el ancla de la fila: ASCII, porque va en la URL. */
  readonly anchor: string;
  readonly words: readonly VocabularySummary[];
}

const SMALL_TO_LARGE: Readonly<Record<string, string>> = {
  ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お', っ: 'つ', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ゎ: 'わ',
};

/** Katakana a hiragana, para buscar y agrupar sin distinguirlos (パン = ぱん). */
export function toHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/gu, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

/** La fila de una lectura por su primer kana, sin dakuten y en tamaño normal (が → か). */
export function rowOf(reading: string): KanaRow | null {
  const base = toHiragana(reading).normalize('NFD').charAt(0);
  const first = SMALL_TO_LARGE[base] ?? base;
  return KANA_ROWS.find((row) => row.kana.includes(first)) ?? null;
}

/**
 * Las palabras de un nivel agrupadas por fila, sin filas vacías. La lista ya
 * viene en orden del silabario; lo que no empieza por kana, si lo hubiera,
 * va en la fila わ, la última.
 */
export function groupByRow(words: readonly VocabularySummary[]): KanaRowGroup[] {
  const groups = KANA_ROWS.map((row, index) => ({ row, anchor: `fila-${index + 1}`, words: [] as VocabularySummary[] }));
  for (const word of words) {
    const row = rowOf(word.reading);
    (groups.find((group) => group.row === row) ?? groups[groups.length - 1]!).words.push(word);
  }
  return groups.filter((group) => group.words.length > 0);
}

/** Minúsculas y sin tildes, para que «cafe» encuentre «café». */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/**
 * Si una palabra coincide con lo que se busca: en japonés, por cómo se
 * escribe o por su lectura (sin distinguir hiragana de katakana); en
 * español, por cualquiera de sus equivalentes.
 */
export function matchesWord(word: VocabularySummary, query: string): boolean {
  const trimmed = query.trim();
  if (trimmed === '') {
    return true;
  }
  const spanish = normalize(trimmed);
  return (
    word.japanese.includes(trimmed) ||
    toHiragana(word.reading).includes(toHiragana(trimmed)) ||
    word.equivalents.some((equivalent) => normalize(equivalent).includes(spanish))
  );
}
