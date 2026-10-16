import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toVocabularyLevelList, toVocabularyWord } from '../helpers/to-dto.js';
import { levelSchema } from '../schemas/params.schema.js';

const row = (japanese: string, reading: string) => ({ id: japanese, japanese, reading, equivalents: [] });

describe('toVocabularyLevelList', () => {
  it('ordena por el silabario sin distinguir hiragana de katakana', () => {
    const list = toVocabularyLevelList(5, [
      row('かさ', 'かさ'),
      row('カード', 'カード'),
      row('会う', 'あう'),
      row('学校', 'がっこう'),
      row('アパート', 'アパート'),
    ]);
    assert.deepEqual(
      list.words.map((word) => word.japanese),
      ['会う', 'アパート', 'カード', 'かさ', '学校'],
    );
  });
});

describe('toVocabularyWord', () => {
  it('valida los ejemplos que vienen del Json', () => {
    const base = {
      ...row('パン', 'パン'),
      level: 5,
      partsOfSpeech: [],
      usuallyKana: false,
      meaning: 'Pan.',
    };
    assert.throws(() => toVocabularyWord({ ...base, examples: [{ japanese: 'パン' }] }));
    assert.equal(toVocabularyWord({ ...base, examples: [] }).examples.length, 0);
  });
});

describe('levelSchema', () => {
  it('acepta del 1 al 5 y los devuelve como número', () => {
    assert.equal(levelSchema.parse('5'), 5);
    assert.equal(levelSchema.parse('1'), 1);
  });

  it('rechaza lo que no es un nivel', () => {
    for (const value of ['0', '6', 'n5', 'N5', '05', '']) {
      assert.equal(levelSchema.safeParse(value).success, false, value);
    }
  });
});
