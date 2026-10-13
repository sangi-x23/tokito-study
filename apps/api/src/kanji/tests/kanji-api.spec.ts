import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toKanjiGradeTable } from '../helpers/to-dto.js';
import { gradeSchema, kanjiCharacterSchema } from '../schemas/params.schema.js';

describe('toKanjiGradeTable', () => {
  it('ordena por frecuencia y deja al final, por carácter, los que no la tienen', () => {
    const table = toKanjiGradeTable(8, [
      { character: '柿', frequency: null, meanings: ['caqui'] },
      { character: '月', frequency: 23, meanings: ['luna', 'mes'] },
      { character: '畏', frequency: null, meanings: ['temor'] },
      { character: '日', frequency: 1, meanings: ['día'] },
    ]);
    assert.deepEqual(table, {
      grade: 8,
      kanji: [
        { character: '日', meaning: 'día' },
        { character: '月', meaning: 'luna' },
        { character: '柿', meaning: 'caqui' },
        { character: '畏', meaning: 'temor' },
      ],
    });
  });
});

describe('gradeSchema', () => {
  it('acepta los grados jōyō y los devuelve como número', () => {
    assert.equal(gradeSchema.parse('1'), 1);
    assert.equal(gradeSchema.parse('8'), 8);
  });

  it('rechaza el 7, los de nombres propios y lo que no es un grado', () => {
    for (const value of ['7', '9', '0', '01', 'secundaria', '']) {
      assert.equal(gradeSchema.safeParse(value).success, false, value);
    }
  });
});

describe('kanjiCharacterSchema', () => {
  it('acepta un solo kanji, incluso fuera del BMP', () => {
    for (const value of ['日', '𠮟']) {
      assert.equal(kanjiCharacterSchema.safeParse(value).success, true, value);
    }
  });

  it('rechaza kana, varios caracteres y texto latino', () => {
    for (const value of ['あ', 'ア', '日本', 'a', '', '%E6%97%A5']) {
      assert.equal(kanjiCharacterSchema.safeParse(value).success, false, value);
    }
  });
});
