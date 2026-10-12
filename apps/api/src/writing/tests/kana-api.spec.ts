import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toKanaTable, type KanaRow } from '../helpers/to-dto.js';
import { scriptSchema } from '../schemas/params.schema.js';

const kana = (character: string, kind: KanaRow['kind'], row: number, column: number): KanaRow => ({
  character,
  kind,
  romaji: character,
  row,
  column,
  strokes: [],
});

describe('toKanaTable', () => {
  it('agrupa por tipo en el orden en que se enseñan y omite los grupos vacíos', () => {
    const table = toKanaTable('HIRAGANA', [
      kana('きゃ', 'COMBINATION', 0, 0),
      kana('が', 'DAKUTEN', 0, 0),
      kana('あ', 'BASIC', 0, 0),
    ]);
    assert.equal(table.script, 'HIRAGANA');
    assert.deepEqual(
      table.groups.map((group) => group.kind),
      ['BASIC', 'DAKUTEN', 'COMBINATION'],
    );
  });

  it('ordena cada grupo por fila y columna', () => {
    const table = toKanaTable('HIRAGANA', [
      kana('き', 'BASIC', 1, 1),
      kana('い', 'BASIC', 0, 1),
      kana('か', 'BASIC', 1, 0),
      kana('あ', 'BASIC', 0, 0),
    ]);
    assert.deepEqual(
      table.groups[0]!.kana.map((entry) => entry.character),
      ['あ', 'い', 'か', 'き'],
    );
  });
});

describe('scriptSchema', () => {
  it('acepta el script en minúsculas y lo devuelve como el enum', () => {
    assert.equal(scriptSchema.parse('hiragana'), 'HIRAGANA');
    assert.equal(scriptSchema.parse('katakana'), 'KATAKANA');
  });

  it('rechaza cualquier otra cosa', () => {
    for (const value of ['HIRAGANA', 'kanji', '', 'ひらがな']) {
      assert.equal(scriptSchema.safeParse(value).success, false);
    }
  });
});
