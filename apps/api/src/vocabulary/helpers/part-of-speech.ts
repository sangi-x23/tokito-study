import type { JmdictSense } from '../types/vocabulary.js';

// Las etiquetas gramaticales de JMdict que usan las palabras de las listas,
// en español. Varias se agrupan (todos los `v5*` son «verbo godan»).
const LABELS: Readonly<Record<string, string>> = {
  n: 'sustantivo',
  'n-adv': 'sustantivo adverbial',
  'n-t': 'sustantivo temporal',
  'n-suf': 'sufijo',
  'n-pref': 'prefijo',
  'adj-no': 'sustantivo que modifica con の',
  'adj-i': 'adjetivo -i',
  'adj-ix': 'adjetivo -i',
  'adj-na': 'adjetivo -na',
  'adj-pn': 'adjetivo prenominal',
  'adj-f': 'modificador prenominal',
  'adj-t': 'adjetivo -taru',
  'adj-ku': 'adjetivo -ku',
  'adj-nari': 'adjetivo -nari',
  'aux-adj': 'adjetivo auxiliar',
  pn: 'pronombre',
  adv: 'adverbio',
  'adv-to': 'adverbio con と',
  vs: 'verbo con する',
  'vs-s': 'verbo con する',
  'vs-i': 'verbo con する',
  v1: 'verbo ichidan',
  'v1-s': 'verbo ichidan',
  vk: 'verbo irregular (来る)',
  vz: 'verbo -zuru',
  'v2a-s': 'verbo nidan',
  vi: 'intransitivo',
  vt: 'transitivo',
  'aux-v': 'verbo auxiliar',
  aux: 'auxiliar',
  cop: 'cópula',
  int: 'interjección',
  exp: 'expresión',
  conj: 'conjunción',
  prt: 'partícula',
  suf: 'sufijo',
  pref: 'prefijo',
  ctr: 'contador',
  num: 'numeral',
  unc: 'sin clasificar',
};

const label = (tag: string): string | undefined => (tag.startsWith('v5') ? 'verbo godan' : LABELS[tag]);

/**
 * Las categorías de todas las acepciones, sin repetir y en orden de
 * aparición. `unknown` recibe las etiquetas que no tienen traducción.
 */
export function partsOfSpeech(senses: readonly JmdictSense[], unknown: Set<string>): string[] {
  const labels = new Set<string>();
  for (const tag of senses.flatMap((sense) => sense.partsOfSpeech)) {
    const spanish = label(tag);
    if (spanish) {
      labels.add(spanish);
    } else {
      unknown.add(tag);
    }
  }
  return [...labels];
}
