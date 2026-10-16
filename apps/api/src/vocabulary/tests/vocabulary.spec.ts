import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseJmdict } from '../helpers/jmdict.js';
import { partsOfSpeech } from '../helpers/part-of-speech.js';
import {
  buildTranslationRequest,
  currentExamples,
  mergeTranslation,
  selectExamples,
  translationSource,
} from '../helpers/translations.js';
import { buildVocabularySeeds, planVocabularySeed } from '../helpers/vocabulary-seed.js';
import { buildVocabularySources, sensesFor } from '../helpers/vocabulary-sources.js';
import { correctWallerWords, parseWallerCsv } from '../helpers/waller.js';
import type { Translation } from '../schemas/translation.schema.js';
import type { JmdictEntry, VocabularySeed, VocabularySource } from '../types/vocabulary.js';

// Un extracto con la forma de JMdict_e_examp: una entrada con varias grafías,
// una acepción restringida a una de ellas, una arcaica y ejemplos de Tatoeba.
const JMDICT = `<?xml version="1.0" encoding="UTF-8"?>
<JMdict>
<entry>
<ent_seq>1000</ent_seq>
<k_ele><keb>会う</keb></k_ele>
<k_ele><keb>遭う</keb></k_ele>
<r_ele><reb>あう</reb></r_ele>
<sense>
<pos>&v5u;</pos>
<pos>&vi;</pos>
<s_inf>used for people</s_inf>
<gloss>to meet</gloss>
<gloss g_type="expl">to see &amp; greet</gloss>
<example>
<ex_srce exsrc_type="tat">11</ex_srce>
<ex_text>会った</ex_text>
<ex_sent xml:lang="jpn">駅でケンジに会った。</ex_sent>
<ex_sent xml:lang="eng">I met Kenji at the station.</ex_sent>
</example>
</sense>
<sense>
<stagk>遭う</stagk>
<misc>&uk;</misc>
<gloss>to have an accident</gloss>
<example>
<ex_srce exsrc_type="tat">12</ex_srce>
<ex_text>遭った</ex_text>
<ex_sent xml:lang="jpn">雨に遭った。</ex_sent>
<ex_sent xml:lang="eng">I was caught in the rain.</ex_sent>
</example>
</sense>
<sense>
<misc>&arch;</misc>
<gloss>to fit</gloss>
</sense>
</entry>
<entry>
<ent_seq>2000</ent_seq>
<r_ele><reb>パン</reb></r_ele>
<sense>
<pos>&n;</pos>
<gloss>bread</gloss>
</sense>
</entry>
<entry>
<ent_seq>3000</ent_seq>
<r_ele><reb>ない</reb></r_ele>
<sense>
<pos>&adj-i;</pos>
<gloss>nonexistent</gloss>
</sense>
</entry>
</JMdict>`;

const entries = parseJmdict(JMDICT, new Set([1000, 2000]));
const meet = entries.get(1000)!;

const N5 = `jmdict_seq,kana,kanji,waller_definition
1000,あう,会う,to meet
2000,パン,,bread
`;
const N4 = `jmdict_seq,kana,kanji,waller_definition
1000,あう,遭う,"to meet,to encounter"
2000,パン,,bread
,い,依,depending on
`;

const words = [...parseWallerCsv(N5, 5), ...parseWallerCsv(N4, 4)];
const sources = buildVocabularySources(words, entries);
const source = (key: string): VocabularySource => sources.find((item) => item.key === key)!;

describe('parseWallerCsv', () => {
  it('lee las comillas, deja vacía la grafía de las palabras en kana y salta las filas sin entrada', () => {
    assert.deepEqual(parseWallerCsv(N4, 4), [
      { level: 4, seq: 1000, kana: 'あう', kanji: '遭う' },
      { level: 4, seq: 2000, kana: 'パン', kanji: '' },
    ]);
  });

  it('corrige la entrada o la grafía de las filas de la tabla de correcciones', () => {
    const corrected = correctWallerWords(parseWallerCsv(N4, 4), {
      'パン|パン': { seq: 3000 },
      '遭う|あう': { kanji: '逢う' },
    });
    assert.deepEqual(corrected, [
      { level: 4, seq: 1000, kana: 'あう', kanji: '逢う' },
      { level: 4, seq: 3000, kana: 'パン', kanji: '' },
    ]);
  });

  it('falla si la cabecera no es la esperada', () => {
    assert.throws(() => parseWallerCsv('kana,kanji\nあう,会う', 5), /cabecera/u);
  });
});

describe('parseJmdict', () => {
  it('lee solo las entradas pedidas', () => {
    assert.deepEqual([...entries.keys()], [1000, 2000]);
  });

  it('decodifica las glosas, toma las etiquetas y hereda la categoría de la acepción anterior', () => {
    assert.deepEqual(meet.kanji, ['会う', '遭う']);
    assert.deepEqual(meet.senses[0]!.glosses, ['to meet', 'to see & greet']);
    assert.deepEqual(meet.senses[0]!.info, ['used for people']);
    assert.deepEqual(meet.senses[1]!.partsOfSpeech, ['v5u', 'vi']);
    assert.deepEqual(meet.senses[1]!.misc, ['uk']);
    assert.deepEqual(meet.senses[1]!.kanjiRestrictions, ['遭う']);
    assert.deepEqual(meet.senses[1]!.examples, [
      { tatoebaId: 12, japanese: '雨に遭った。', english: 'I was caught in the rain.' },
    ]);
  });
});

describe('sensesFor', () => {
  it('quita las acepciones de otra grafía y las arcaicas', () => {
    assert.deepEqual(
      sensesFor(meet, '会う', 'あう').map((sense) => sense.glosses[0]),
      ['to meet'],
    );
    assert.deepEqual(
      sensesFor(meet, '遭う', 'あう').map((sense) => sense.glosses[0]),
      ['to meet', 'to have an accident'],
    );
  });

  it('si solo quedan arcaicas, se queda con ellas', () => {
    const entry: JmdictEntry = { ...meet, senses: [meet.senses[2]!] };
    assert.equal(sensesFor(entry, '会う', 'あう').length, 1);
  });
});

describe('buildVocabularySources', () => {
  it('une cada grafía con JMdict y deja la palabra repetida en el nivel más fácil', () => {
    assert.deepEqual(
      sources.map((item) => [item.key, item.level]),
      [
        ['会う|あう', 5],
        ['パン|パン', 5],
        ['遭う|あう', 4],
      ],
    );
  });

  it('falla si una palabra no está en JMdict', () => {
    assert.throws(
      () => buildVocabularySources([{ level: 5, seq: 9999, kana: 'なに', kanji: '' }], entries),
      /なに\|なに \(N5\): no está en JMdict/u,
    );
  });
});

describe('selectExamples', () => {
  it('prefiere los que ya tienen traducción de Tatoeba', () => {
    const spanish = new Map([[12, { id: 99, text: 'Me agarró la lluvia.' }]]);
    assert.deepEqual(
      selectExamples(source('遭う|あう'), spanish).map((example) => example.tatoebaId),
      [12, 11],
    );
    assert.deepEqual(
      selectExamples(source('遭う|あう'), new Map()).map((example) => example.tatoebaId),
      [11, 12],
    );
  });
});

describe('mergeTranslation', () => {
  const spanish = new Map([[12, { id: 99, text: 'Me agarró la lluvia.' }]]);
  const request = buildTranslationRequest(source('遭う|あう'), spanish);
  const response = {
    key: '遭う|あう',
    equivalents: ['sufrir'],
    meaning: 'Sufrir algo malo, como un accidente o la lluvia.',
    examples: [{ tatoebaId: 11, spanish: 'Me encontré con Kenji en la estación.' }],
  };

  it('conserva la traducción de Tatoeba y guarda la huella del inglés', () => {
    const translation = mergeTranslation(source('遭う|あう'), request, response);
    assert.deepEqual(translation.examples, [
      { tatoebaId: 12, spanish: 'Me agarró la lluvia.', spanishTatoebaId: 99 },
      { tatoebaId: 11, spanish: 'Me encontré con Kenji en la estación.', spanishTatoebaId: null },
    ]);
    assert.match(translation.source, /^[0-9a-f]{16}$/u);
    assert.notEqual(currentExamples(source('遭う|あう'), translation), null);
  });

  it('falla si falta un ejemplo o sobra uno', () => {
    assert.throws(() => mergeTranslation(source('遭う|あう'), request, { ...response, examples: [] }), /falta/u);
    assert.throws(
      () =>
        mergeTranslation(source('遭う|あう'), request, {
          ...response,
          examples: [...response.examples, { tatoebaId: 77, spanish: 'Otra.' }],
        }),
      /no se pidieron/u,
    );
  });
});

const translate = (item: VocabularySource, overrides: Partial<Translation> = {}): Translation => ({
  key: item.key,
  source: translationSource(item, []),
  equivalents: ['algo'],
  meaning: 'Una explicación de prueba.',
  examples: [],
  ...overrides,
});

describe('buildVocabularySeeds', () => {
  it('une la palabra con su traducción y marca las que suelen ir en kana', () => {
    const translations = new Map(sources.map((item) => [item.key, translate(item)]));
    const seeds = buildVocabularySeeds(sources, translations);
    const met = seeds.find((seed) => seed.japanese === '遭う')!;
    assert.deepEqual(met.partsOfSpeech, ['verbo godan', 'intransitivo']);
    assert.equal(met.usuallyKana, false);
    assert.equal(seeds.find((seed) => seed.japanese === 'パン')!.usuallyKana, false);
  });

  it('falla con las que no tienen traducción o tienen una vieja', () => {
    const translations = new Map([
      ['会う|あう', translate(source('会う|あう'), { source: '0000000000000000' })],
      ['パン|パン', translate(source('パン|パン'))],
    ]);
    assert.throws(
      () => buildVocabularySeeds(sources, translations),
      (error: Error) => /Sin traducción \(1\).*遭う\|あう/u.test(error.message) && /vieja \(1\).*会う\|あう/u.test(error.message),
    );
  });
});

describe('partsOfSpeech', () => {
  it('agrupa los godan y avisa de las etiquetas sin nombre', () => {
    const unknown = new Set<string>();
    const sense = { ...meet.senses[0]!, partsOfSpeech: ['v5u', 'v5r', 'vt', 'zzz'] };
    assert.deepEqual(partsOfSpeech([sense], unknown), ['verbo godan', 'transitivo']);
    assert.deepEqual([...unknown], ['zzz']);
  });
});

describe('planVocabularySeed', () => {
  const seed: VocabularySeed = {
    japanese: 'パン',
    reading: 'パン',
    level: 5,
    jmdictSeq: 2000,
    partsOfSpeech: ['sustantivo'],
    usuallyKana: false,
    equivalents: ['pan'],
    meaning: 'Pan, el alimento.',
    examples: [{ japanese: 'パンを食べる。', spanish: 'Como pan.', tatoebaId: 1, spanishTatoebaId: null }],
  };

  it('no cuenta como cambio el orden de las claves del Json', () => {
    const stored = {
      ...seed,
      id: 'a',
      examples: [{ spanishTatoebaId: null, tatoebaId: 1, spanish: 'Como pan.', japanese: 'パンを食べる。' }],
    };
    assert.deepEqual(planVocabularySeed([seed], [stored]), { create: [], update: [], unchanged: 1, orphaned: [] });
  });

  it('crea lo nuevo, actualiza lo que cambió y avisa lo que sobra', () => {
    const stored = [
      { ...seed, id: 'a', meaning: 'Viejo.' },
      { ...seed, id: 'b', japanese: '麺麭', reading: 'ぱん' },
    ];
    const other = { ...seed, japanese: '会う', reading: 'あう' };
    const plan = planVocabularySeed([seed, other], stored);
    assert.deepEqual(plan.create, [other]);
    assert.deepEqual(plan.update, [{ id: 'a', word: seed }]);
    assert.deepEqual(plan.orphaned, ['麺麭|ぱん']);
  });
});
