import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planKanaSeed, withStrokes } from '../helpers/kana-seed.js';
import { kanaTable, singleCharacters, toKatakana } from '../helpers/kana-table.js';
import { kanjiVgUrl, parseStrokes } from '../helpers/kanjivg.js';
import type { KanaSeed } from '../types/kana.js';

describe('kanaTable', () => {
  const table = kanaTable();
  const count = (script: string, kind: string): number =>
    table.filter((kana) => kana.script === script && kana.kind === kind).length;

  it('tiene los conjuntos completos de cada script', () => {
    for (const script of ['HIRAGANA', 'KATAKANA']) {
      assert.equal(count(script, 'BASIC'), 46);
      assert.equal(count(script, 'DAKUTEN'), 20);
      assert.equal(count(script, 'HANDAKUTEN'), 5);
      assert.equal(count(script, 'COMBINATION'), 33);
    }
    assert.equal(count('HIRAGANA', 'SMALL'), 10);
    assert.equal(count('KATAKANA', 'SMALL'), 11); // con ー
    assert.equal(count('HIRAGANA', 'EXTENDED'), 0);
    assert.ok(count('KATAKANA', 'EXTENDED') > 0);
  });

  it('no repite caracteres ni celdas', () => {
    assert.equal(new Set(table.map((kana) => kana.character)).size, table.length);
    const cells = table.map((kana) => `${kana.script}/${kana.kind}/${kana.row}/${kana.column}`);
    assert.equal(new Set(cells).size, table.length);
  });

  it('deja los huecos de la tabla tradicional', () => {
    const ya = table.filter((kana) => kana.script === 'HIRAGANA' && kana.kind === 'BASIC' && kana.row === 7);
    assert.deepEqual(
      ya.map((kana) => [kana.character, kana.column]),
      [['や', 0], ['ゆ', 2], ['よ', 4]],
    );
  });

  it('pone la katakana en la misma celda que su hiragana', () => {
    const shi = table.find((kana) => kana.character === 'し')!;
    const katakana = table.find((kana) => kana.character === 'シ')!;
    assert.deepEqual([katakana.kind, katakana.row, katakana.column, katakana.romaji], [shi.kind, shi.row, shi.column, shi.romaji]);
  });

  it('solo pide trazos de los caracteres sueltos', () => {
    const singles = singleCharacters(table);
    assert.ok(singles.includes('ゃ') && singles.includes('ヴ') && singles.includes('ー'));
    assert.ok(!singles.includes('きゃ') && !singles.includes('ファ'));
  });
});

describe('toKatakana', () => {
  it('convierte cada hiragana y deja lo demás', () => {
    assert.equal(toKatakana('きゃっ'), 'キャッ');
    assert.equal(toKatakana('ー'), 'ー');
  });
});

describe('kanjiVgUrl', () => {
  it('nombra el archivo por el code point en cinco dígitos', () => {
    assert.equal(kanjiVgUrl('あ', 'r1'), 'https://raw.githubusercontent.com/KanjiVG/kanjivg/r1/kanji/03042.svg');
  });
});

describe('parseStrokes', () => {
  const svg = (paths: string): string => `<svg><g id="kvg:StrokePaths_03042">${paths}</g></svg>`;

  it('ordena los trazos por su número y no por su posición en el SVG', () => {
    const strokes = parseStrokes(
      svg('<path id="kvg:03042-s2" d="M2,2c1,1"/><path d="M1,1l3,3" id="kvg:03042-s1"/>'),
    );
    assert.deepEqual(strokes, ['M1,1l3,3', 'M2,2c1,1']);
  });

  it('falla si falta un trazo', () => {
    assert.throws(() => parseStrokes(svg('<path id="kvg:03042-s1" d="M1,1"/><path id="kvg:03042-s3" d="M3,3"/>')));
  });

  it('falla sin trazos o con algo que no es un path', () => {
    assert.throws(() => parseStrokes(svg('')));
    assert.throws(() => parseStrokes(svg('<path id="kvg:03042-s1" d="M1,1&lt;script"/>')));
  });
});

describe('withStrokes', () => {
  const table = [
    { character: 'き', script: 'HIRAGANA', kind: 'BASIC', romaji: 'ki', row: 1, column: 1 },
    { character: 'きゃ', script: 'HIRAGANA', kind: 'COMBINATION', romaji: 'kya', row: 0, column: 0 },
  ] as const;

  it('deja sin trazos propios a los kana de varios caracteres', () => {
    const seeds = withStrokes(table, new Map([['き', ['M1,1']]]));
    assert.deepEqual(seeds.map((kana) => kana.strokes), [['M1,1'], []]);
  });

  it('falla si falta el SVG de un carácter suelto', () => {
    assert.throws(() => withStrokes(table, new Map()));
  });
});

describe('planKanaSeed', () => {
  const a: KanaSeed = { character: 'あ', script: 'HIRAGANA', kind: 'BASIC', romaji: 'a', row: 0, column: 0, strokes: ['M1,1'] };
  const i: KanaSeed = { ...a, character: 'い', romaji: 'i', column: 1 };

  it('crea lo nuevo, actualiza lo que cambió y cuenta lo demás', () => {
    const plan = planKanaSeed(
      [a, i],
      [{ ...a, id: 'id-a' }, { ...i, id: 'id-i', strokes: ['M0,0'] }],
    );
    assert.equal(plan.create.length, 0);
    assert.deepEqual(plan.update.map((entry) => entry.id), ['id-i']);
    assert.equal(plan.unchanged, 1);
  });

  it('avisa de las filas que la tabla ya no define sin borrarlas', () => {
    const plan = planKanaSeed([a], [{ ...i, id: 'id-i' }]);
    assert.deepEqual(plan.create, [a]);
    assert.deepEqual(plan.orphaned, ['い']);
  });
});
