import type { Kana, KanaTable } from '@tokito/shared';

/** Lo que muestra el modal de un kana relacionado: no hace falta más. */
export interface KanaRef {
  readonly character: string;
  readonly romaji: string;
}

/** Los kana que salen de un kana básico. */
export interface KanaRelations {
  /** Con tenten ゛: か → が. */
  readonly tenten: readonly KanaRef[];
  /** Con maru ゜: は → ぱ. */
  readonly maru: readonly KanaRef[];
  /** Con ya, yu, yo pequeños, también los de su versión con tenten o maru: きゃ, ぎゃ. */
  readonly combinations: readonly KanaRef[];
  /** Katakana extendida que empieza por él o por su versión con tenten: ファ, ディ. */
  readonly extended: readonly KanaRef[];
}

// En Unicode, が se descompone (NFD) en か + U+3099 y ぱ en は + U+309A.
const TENTEN = '゙';
const MARU = '゚';

function decompose(character: string): { base: string; mark: string | undefined } {
  const [base = character, mark] = [...character.normalize('NFD')];
  return { base, mark };
}

const toRef = (kana: Kana): KanaRef => ({ character: kana.character, romaji: kana.romaji });

/**
 * Las relaciones de cada kana básico de la tabla, por su carácter. Salen de
 * los propios caracteres: el primer carácter de una combinación, sin tenten
 * ni maru, es el kana básico del que viene (ぎゃ → ぎ → き).
 */
export function kanaRelations(table: KanaTable): Record<string, KanaRelations> {
  const relations: Record<string, { tenten: KanaRef[]; maru: KanaRef[]; combinations: KanaRef[]; extended: KanaRef[] }> =
    {};
  const basics = table.groups.find((group) => group.kind === 'BASIC')?.kana ?? [];
  for (const kana of basics) {
    relations[kana.character] = { tenten: [], maru: [], combinations: [], extended: [] };
  }

  for (const group of table.groups) {
    for (const kana of group.kana) {
      const characters = [...kana.character];
      const { base, mark } = decompose(characters[0]!);
      const target = relations[base];
      if (!target || group.kind === 'BASIC' || group.kind === 'SMALL') {
        continue;
      }

      if (characters.length === 1) {
        // が, ぱ y también ヴ, que la tabla guarda como extendido.
        if (mark === TENTEN) {
          target.tenten.push(toRef(kana));
        } else if (mark === MARU) {
          target.maru.push(toRef(kana));
        }
      } else if (group.kind === 'COMBINATION') {
        target.combinations.push(toRef(kana));
      } else if (group.kind === 'EXTENDED') {
        target.extended.push(toRef(kana));
      }
    }
  }

  return relations;
}
