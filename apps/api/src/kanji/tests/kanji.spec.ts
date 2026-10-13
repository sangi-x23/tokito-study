import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SPANISH_MEANINGS } from '../helpers/kanji-meanings-es.js';
import { buildKanjiSeeds, planKanjiSeed } from '../helpers/kanji-seed.js';
import { parseKanjidic } from '../helpers/kanjidic.js';
import { kanjiVgBundleUrl, parseKanjiVgBundle } from '../helpers/kanjivg-bundle.js';
import type { KanjidicEntry, KanjiSeed } from '../types/kanji.js';

// Un extracto con la forma de KANJIDIC2: un kanji de primaria completo, uno
// de secundaria sin español ni frecuencia y uno de nombres propios (grado 9).
const KANJIDIC = `<?xml version="1.0" encoding="UTF-8"?>
<kanjidic2>
<character>
<literal>日</literal>
<misc>
<grade>1</grade>
<stroke_count>4</stroke_count>
<freq>1</freq>
<jlpt>4</jlpt>
</misc>
<reading_meaning>
<rmgroup>
<reading r_type="pinyin">ri4</reading>
<reading r_type="ja_on">ニチ</reading>
<reading r_type="ja_on">ジツ</reading>
<reading r_type="ja_kun">ひ</reading>
<reading r_type="ja_kun">-び</reading>
<meaning>day</meaning>
<meaning>sun &amp; light</meaning>
<meaning m_lang="fr">jour</meaning>
<meaning m_lang="es">día</meaning>
<meaning m_lang="es">sol</meaning>
</rmgroup>
<nanori>あ</nanori>
</reading_meaning>
</character>
<character>
<literal>柿</literal>
<misc>
<grade>8</grade>
<stroke_count>9</stroke_count>
</misc>
<reading_meaning>
<rmgroup>
<reading r_type="ja_on">シ</reading>
<reading r_type="ja_kun">かき</reading>
<meaning>persimmon</meaning>
</rmgroup>
</reading_meaning>
</character>
<character>
<literal>亘</literal>
<misc>
<grade>9</grade>
<stroke_count>6</stroke_count>
</misc>
</character>
</kanjidic2>`;

// Un extracto con la forma del XML del release de KanjiVG.
const KANJIVG = `<kanjivg>
<kanji id="kvg:kanji_065e5">
<g id="kvg:065e5" kvg:element="日">
	<path id="kvg:065e5-s2" d="M33,26c0.8,0,37,-3,40,-3"/>
	<path id="kvg:065e5-s1" d="M31.5,24.5c1,1,1.7,2.7,1.7,4.7"/>
</g>
</kanji>
<kanji id="kvg:kanji_20b9f">
<g id="kvg:20b9f">
	<path id="kvg:20b9f-s1" d="M10,10L20,20"/>
</g>
</kanji>
<kanji id="kvg:kanji_06708">
<g id="kvg:06708">
	<path id="kvg:06708-s1" d="M1,1L2,2"/>
</g>
</kanji>
</kanjivg>`;

describe('parseKanjidic', () => {
  const entries = parseKanjidic(KANJIDIC);

  it('trae solo los jōyō: grados 1–6 y 8', () => {
    assert.deepEqual(
      entries.map((entry) => entry.character),
      ['日', '柿'],
    );
  });

  it('separa lecturas on y kun y los significados por idioma', () => {
    assert.deepEqual(entries[0], {
      character: '日',
      grade: 1,
      frequency: 1,
      meanings: ['día', 'sol'],
      englishMeanings: ['day', 'sun & light'],
      onyomi: ['ニチ', 'ジツ'],
      kunyomi: ['ひ', '-び'],
    });
  });

  it('deja vacíos los significados en español y null la frecuencia que no existen', () => {
    assert.deepEqual(entries[1]!.meanings, []);
    assert.equal(entries[1]!.frequency, null);
  });
});

describe('parseKanjiVgBundle', () => {
  it('trae los trazos ordenados de los caracteres pedidos, incluso fuera del BMP', () => {
    const strokes = parseKanjiVgBundle(KANJIVG, ['日', '𠮟']);
    assert.deepEqual([...strokes.keys()], ['日', '𠮟']);
    assert.deepEqual(strokes.get('日'), ['M31.5,24.5c1,1,1.7,2.7,1.7,4.7', 'M33,26c0.8,0,37,-3,40,-3']);
  });

  it('arma la URL del XML a partir del tag', () => {
    assert.equal(
      kanjiVgBundleUrl('r20260714'),
      'https://github.com/KanjiVG/kanjivg/releases/download/r20260714/kanjivg-20260714.xml.gz',
    );
  });
});

describe('buildKanjiSeeds', () => {
  const entry = (character: string, meanings: string[]): KanjidicEntry => ({
    character,
    grade: 8,
    frequency: null,
    meanings,
    englishMeanings: ['meaning'],
    onyomi: [],
    kunyomi: [],
  });
  const strokes = new Map([
    ['日', ['M1,1']],
    ['柿', ['M2,2']],
  ]);

  it('completa con las traducciones lo que KANJIDIC2 no trae en español', () => {
    const { seeds, unusedTranslations } = buildKanjiSeeds(
      [entry('日', ['día']), entry('柿', [])],
      strokes,
      { 柿: ['caqui'], 日: ['sobra'] },
    );
    assert.deepEqual(
      seeds.map((seed) => seed.meanings),
      [['día'], ['caqui']],
    );
    assert.deepEqual(seeds[1]!.strokes, ['M2,2']);
    assert.deepEqual(unusedTranslations, ['日']);
  });

  it('falla con todo lo que falta: trazos y significados', () => {
    assert.throws(
      () => buildKanjiSeeds([entry('柿', []), entry('月', ['luna'])], strokes, {}),
      (error: Error) => error.message.includes('Sin trazos en KanjiVG: 月') && error.message.includes('柿 (meaning)'),
    );
  });
});

describe('planKanjiSeed', () => {
  const seed = (character: string, meanings: string[]): KanjiSeed => ({
    character,
    grade: 1,
    frequency: 1,
    meanings,
    onyomi: [],
    kunyomi: [],
    strokes: ['M1,1'],
  });

  it('crea lo nuevo, actualiza lo que cambió y avisa lo que sobra, sin borrarlo', () => {
    const plan = planKanjiSeed(
      [seed('日', ['día']), seed('月', ['luna']), seed('火', ['fuego'])],
      [
        { id: 'a', ...seed('日', ['día']) },
        { id: 'b', ...seed('月', ['mes']) },
        { id: 'c', ...seed('亘', ['extenderse']) },
      ],
    );
    assert.equal(plan.unchanged, 1);
    assert.deepEqual(
      plan.update.map(({ id }) => id),
      ['b'],
    );
    assert.deepEqual(
      plan.create.map((kanji) => kanji.character),
      ['火'],
    );
    assert.deepEqual(plan.orphaned, ['亘']);
  });
});

describe('SPANISH_MEANINGS', () => {
  it('cada entrada es un solo kanji con al menos un significado', () => {
    for (const [character, meanings] of Object.entries(SPANISH_MEANINGS)) {
      assert.equal([...character].length, 1, character);
      assert.ok(meanings.length > 0 && meanings.every((meaning) => meaning.trim() !== ''), character);
    }
  });
});
