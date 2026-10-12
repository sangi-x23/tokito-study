import type { KanaKind } from '../../generated/prisma/enums.js';
import type { KanaDefinition } from '../types/kana.js';

// Cada grupo es una cuadrícula: una fila por línea y una columna por vocal
// (a, i, u, e, o) o, en las combinaciones, por ya, yu, yo. `null` deja el
// hueco donde la tabla tradicional no tiene kana (や no tiene yi ni ye).
type Cell = readonly [character: string, romaji: string] | null;
type Grid = readonly (readonly Cell[])[];

// Romaji Hepburn, salvo を, que va como wo: así lo enseñan los cursos y se
// distingue de お en la práctica.
const BASIC: Grid = [
  [['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o']],
  [['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko']],
  [['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so']],
  [['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to']],
  [['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no']],
  [['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho']],
  [['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo']],
  [['や', 'ya'], null, ['ゆ', 'yu'], null, ['よ', 'yo']],
  [['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro']],
  [['わ', 'wa'], null, null, null, ['を', 'wo']],
  [['ん', 'n']],
];

const DAKUTEN: Grid = [
  [['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go']],
  [['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo']],
  [['だ', 'da'], ['ぢ', 'ji'], ['づ', 'zu'], ['で', 'de'], ['ど', 'do']],
  [['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo']],
];

const HANDAKUTEN: Grid = [[['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po']]];

// Los pequeños llevan el romaji de su versión grande: el kind ya dice que
// son pequeños. っ no suena, pero se escribe y se nombra como un つ pequeño.
const SMALL: Grid = [
  [['ぁ', 'a'], ['ぃ', 'i'], ['ぅ', 'u'], ['ぇ', 'e'], ['ぉ', 'o']],
  [['っ', 'tsu']],
  [['ゃ', 'ya'], null, ['ゅ', 'yu'], null, ['ょ', 'yo']],
  [['ゎ', 'wa']],
];

const COMBINATION: Grid = [
  [['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo']],
  [['しゃ', 'sha'], ['しゅ', 'shu'], ['しょ', 'sho']],
  [['ちゃ', 'cha'], ['ちゅ', 'chu'], ['ちょ', 'cho']],
  [['にゃ', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo']],
  [['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo']],
  [['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo']],
  [['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo']],
  [['ぎゃ', 'gya'], ['ぎゅ', 'gyu'], ['ぎょ', 'gyo']],
  [['じゃ', 'ja'], ['じゅ', 'ju'], ['じょ', 'jo']],
  [['びゃ', 'bya'], ['びゅ', 'byu'], ['びょ', 'byo']],
  [['ぴゃ', 'pya'], ['ぴゅ', 'pyu'], ['ぴょ', 'pyo']],
];

// Solo katakana. Una fila por consonante y una columna por vocal.
const EXTENDED: Grid = [
  [null, null, null, ['イェ', 'ye']],
  [null, ['ウィ', 'wi'], null, ['ウェ', 'we'], ['ウォ', 'wo']],
  [['ヴァ', 'va'], ['ヴィ', 'vi'], ['ヴ', 'vu'], ['ヴェ', 've'], ['ヴォ', 'vo']],
  [null, null, null, ['シェ', 'she']],
  [null, null, null, ['ジェ', 'je']],
  [null, null, null, ['チェ', 'che']],
  [['ツァ', 'tsa'], ['ツィ', 'tsi'], null, ['ツェ', 'tse'], ['ツォ', 'tso']],
  [null, ['ティ', 'ti'], ['トゥ', 'tu']],
  [null, ['ディ', 'di'], ['ドゥ', 'du']],
  [['ファ', 'fa'], ['フィ', 'fi'], null, ['フェ', 'fe'], ['フォ', 'fo']],
  [null, null, ['テュ', 'tyu']],
  [null, null, ['デュ', 'dyu']],
];

// ー no tiene hiragana: es la marca de vocal larga de la katakana.
const LONG_VOWEL_MARK: KanaDefinition = {
  character: 'ー',
  script: 'KATAKANA',
  kind: 'SMALL',
  romaji: '-',
  row: 4,
  column: 0,
};

// En Unicode cada hiragana (ぁ U+3041 … ゖ U+3096) está 0x60 antes que su katakana.
const HIRAGANA_TO_KATAKANA = 0x60;

export function toKatakana(hiragana: string): string {
  return hiragana.replace(/[ぁ-ゖ]/gu, (char) =>
    String.fromCodePoint(char.codePointAt(0)! + HIRAGANA_TO_KATAKANA),
  );
}

function fromGrid(grid: Grid, kind: KanaKind, script: KanaDefinition['script']): KanaDefinition[] {
  return grid.flatMap((cells, row) =>
    cells.flatMap((cell, column) => (cell ? [{ character: cell[0], script, kind, romaji: cell[1], row, column }] : [])),
  );
}

const HIRAGANA_GRIDS: readonly (readonly [KanaKind, Grid])[] = [
  ['BASIC', BASIC],
  ['DAKUTEN', DAKUTEN],
  ['HANDAKUTEN', HANDAKUTEN],
  ['SMALL', SMALL],
  ['COMBINATION', COMBINATION],
];

/**
 * Todos los kana que carga el seed: hiragana, su katakana equivalente, ー y la
 * katakana extendida. El orden es el de las tablas de arriba.
 */
export function kanaTable(): KanaDefinition[] {
  const hiragana = HIRAGANA_GRIDS.flatMap(([kind, grid]) => fromGrid(grid, kind, 'HIRAGANA'));
  const katakana = hiragana.map((kana) => ({ ...kana, script: 'KATAKANA' as const, character: toKatakana(kana.character) }));
  return [...hiragana, ...katakana, LONG_VOWEL_MARK, ...fromGrid(EXTENDED, 'EXTENDED', 'KATAKANA')];
}

/** Los caracteres sueltos de la tabla, que son los que tienen trazos propios. */
export function singleCharacters(table: readonly KanaDefinition[]): string[] {
  return table.filter((kana) => [...kana.character].length === 1).map((kana) => kana.character);
}
