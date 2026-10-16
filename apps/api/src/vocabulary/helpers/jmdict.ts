import type { JmdictEntry, JmdictExample, JmdictSense } from '../types/vocabulary.js';

// JMdict (EDRDG, CC BY-SA 4.0) en inglés y con los ejemplos de Tatoeba que
// el proyecto asigna a cada acepción. Como KANJIDIC2, se publica sin
// versiones fijas: si cambia el inglés de una palabra, su traducción queda
// vieja y el seed lo avisa.
export const JMDICT_URL = 'https://www.edrdg.org/pub/Nihongo/JMdict_e_examp.gz';

const ENTRY = /<entry>([\s\S]*?)<\/entry>/gu;
const SEQ = /<ent_seq>(\d+)<\/ent_seq>/u;
const SENSE = /<sense>([\s\S]*?)<\/sense>/gu;
const EXAMPLE = /<example>([\s\S]*?)<\/example>/gu;
const TATOEBA_ID = /<ex_srce exsrc_type="tat">(\d+)<\/ex_srce>/u;
const SENTENCE_JA = /<ex_sent xml:lang="jpn">([^<]*)<\/ex_sent>/u;
const SENTENCE_EN = /<ex_sent xml:lang="eng">([^<]*)<\/ex_sent>/u;

// Además de las de XML, el archivo declara una entidad por etiqueta
// (`&v5u;`), que solo aparecen solas dentro de <pos>, <misc>, etc.
const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (text: string): string => text.replace(/&(amp|lt|gt|quot|apos);/gu, (_, name: string) => ENTITIES[name]!);

// Algunas etiquetas traen atributos (`<gloss g_type="expl">`).
const texts = (block: string, tag: string): string[] =>
  [...block.matchAll(new RegExp(`<${tag}(?: [^>]*)?>([^<]*)</${tag}>`, 'gu'))].map((match) => decode(match[1]!));

const entities = (block: string, tag: string): string[] =>
  [...block.matchAll(new RegExp(`<${tag}>&([\\w-]+);</${tag}>`, 'gu'))].map((match) => match[1]!);

function parseExamples(sense: string): JmdictExample[] {
  return [...sense.matchAll(EXAMPLE)].flatMap(([, block]) => {
    const id = TATOEBA_ID.exec(block!)?.[1];
    const japanese = SENTENCE_JA.exec(block!)?.[1];
    const english = SENTENCE_EN.exec(block!)?.[1];
    return id && japanese && english
      ? [{ tatoebaId: Number(id), japanese: decode(japanese), english: decode(english) }]
      : [];
  });
}

/**
 * Las entradas de JMdict con esos `seq`. Una acepción sin <pos> hereda la de
 * la anterior, como indica la DTD.
 */
export function parseJmdict(xml: string, seqs: ReadonlySet<number>): Map<number, JmdictEntry> {
  const entries = new Map<number, JmdictEntry>();
  for (const [, block] of xml.matchAll(ENTRY)) {
    const seq = Number(SEQ.exec(block!)?.[1]);
    if (!seqs.has(seq)) {
      continue;
    }
    let partsOfSpeech: string[] = [];
    const senses = [...block!.matchAll(SENSE)].map(([, sense]): JmdictSense => {
      const own = entities(sense!, 'pos');
      if (own.length > 0) {
        partsOfSpeech = own;
      }
      return {
        partsOfSpeech,
        misc: entities(sense!, 'misc'),
        glosses: texts(sense!, 'gloss'),
        info: texts(sense!, 's_inf'),
        kanjiRestrictions: texts(sense!, 'stagk'),
        readingRestrictions: texts(sense!, 'stagr'),
        examples: parseExamples(sense!),
      };
    });
    entries.set(seq, { seq, kanji: texts(block!, 'keb'), readings: texts(block!, 'reb'), senses });
  }
  return entries;
}
