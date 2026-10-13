import type { KanjiGrade } from '@tokito/shared';
import type { KanjidicEntry } from '../types/kanji.js';

// KANJIDIC2 (EDRDG, CC BY-SA 4.0). Se publica a diario y sin versiones
// fijas: cada corrida del seed trae la última y actualiza lo que cambió.
export const KANJIDIC_URL = 'https://www.edrdg.org/kanjidic/kanjidic2.xml.gz';

// Los jōyō son los grados 1–6 (primaria) y 8 (secundaria); 9 y 10 son los
// de nombres propios (jinmeiyō), que no se cargan.
const JOYO_GRADES: ReadonlySet<number> = new Set([1, 2, 3, 4, 5, 6, 8]);

const CHARACTER = /<character>([\s\S]*?)<\/character>/gu;
const LITERAL = /<literal>([^<]+)<\/literal>/u;
const GRADE = /<grade>(\d+)<\/grade>/u;
const FREQUENCY = /<freq>(\d+)<\/freq>/u;

// El archivo no declara entidades propias: solo trae las de XML.
const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (text: string): string => text.replace(/&(amp|lt|gt|quot|apos);/gu, (_, name: string) => ENTITIES[name]!);

/** Los textos de una etiqueta con un atributo exacto (o sin atributos, con `attributes = ''`). */
function texts(block: string, tag: string, attributes: string): string[] {
  const pattern = new RegExp(`<${tag}${attributes ? ` ${attributes}` : ''}>([^<]*)</${tag}>`, 'gu');
  return [...block.matchAll(pattern)].map((match) => decode(match[1]!));
}

/** Los kanji jōyō de KANJIDIC2, en el orden del archivo. */
export function parseKanjidic(xml: string): KanjidicEntry[] {
  return [...xml.matchAll(CHARACTER)].flatMap(([, block]) => {
    const grade = Number(GRADE.exec(block!)?.[1]);
    const character = LITERAL.exec(block!)?.[1];
    if (!character || !JOYO_GRADES.has(grade)) {
      return [];
    }
    const frequency = FREQUENCY.exec(block!)?.[1];

    return [
      {
        character,
        grade: grade as KanjiGrade,
        frequency: frequency ? Number(frequency) : null,
        meanings: texts(block!, 'meaning', 'm_lang="es"'),
        englishMeanings: texts(block!, 'meaning', ''),
        onyomi: texts(block!, 'reading', 'r_type="ja_on"'),
        kunyomi: texts(block!, 'reading', 'r_type="ja_kun"'),
      },
    ];
  });
}
