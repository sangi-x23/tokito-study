import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectPersonalNames, stripPersonalData } from '../helpers/strip-personal-data';

describe('stripPersonalData', () => {
  it('quita la línea con el enlace de Meet', () => {
    const input = 'Clase 5\nhttps://meet.google.com/abc-defg-hij\nVocabulario nuevo';
    assert.equal(stripPersonalData(input), 'Clase 5\nVocabulario nuevo');
  });

  it('quita la línea con un correo', () => {
    const input = 'Clase 5\nDudas a profesora@example.com\n日本語';
    assert.equal(stripPersonalData(input), 'Clase 5\n日本語');
  });

  it('quita la lista de asistentes por su etiqueta', () => {
    const input = 'Clase 5\nParticipantes: Ana, Luis, Marta\nGramática';
    assert.equal(stripPersonalData(input), 'Clase 5\nGramática');
  });

  it('no toca el material de estudio', () => {
    const input = '日曜日 (にちようび) — domingo\n月曜日 (げつようび) — lunes';
    assert.equal(stripPersonalData(input), input);
  });

  it('deja intacto un texto sin datos personales aunque mencione una clase', () => {
    const input = 'La profesora explicó los contadores';
    assert.equal(stripPersonalData(input), input);
  });

  it('quita la asistencia con etiqueta japonesa y dos puntos de ancho completo', () => {
    const input = 'くがつ　よっか\n出席者：全員 Ana, Luis\n欠席者：Marta\nすうじ';
    assert.equal(stripPersonalData(input), 'くがつ　よっか\nすうじ');
  });

  it('quita la línea del enlace de videollamada aunque no traiga la URL', () => {
    const input = 'TOKITOクラス\nLink de Videollamada\nひらがな';
    assert.equal(stripPersonalData(input), 'TOKITOクラス\nひらがな');
  });

  it('quita las menciones a un profesor y deja el 〜せんせい del vocabulario', () => {
    const input = 'ケンジせんせい は がくせい ですか。\nたなか先生\n〜せんせい / profe\nせんせい：SENSEE';
    assert.equal(stripPersonalData(input), '〜せんせい / profe\nせんせい：SENSEE');
  });

  it('quita a un compañero con くん o ちゃん aunque no esté en la lista', () => {
    const input = 'ペドロくん　は　がくせい　ですか。\nルナちゃん　は　ダンス\nアランさん　は　エンジニア　です。';
    assert.equal(stripPersonalData(input), 'アランさん　は　エンジニア　です。');
  });

  it('no confunde un correo con un @ suelto', () => {
    const input = 'おこさん：su hij@';
    assert.equal(stripPersonalData(input), input);
  });

  it('quita las líneas que nombran a alguien de la lista, como palabra completa', () => {
    const names = { latin: ['ana', 'sara'], katakana: ['サラ', 'ケンジ'] };
    const input = [
      'わたしは　サラです。',
      'ケンジちゃんの　おかあさん',
      'La mamá de Ana',
      'SARADA：サラダ：ensalada',
      'BANANA：バナナ：banano',
    ].join('\n');

    assert.equal(stripPersonalData(input, names), 'SARADA：サラダ：ensalada\nBANANA：バナナ：banano');
  });
});

describe('collectPersonalNames', () => {
  it('saca los nombres latinos de la asistencia, sin el 全員', () => {
    const names = collectPersonalNames('出席者：全員 Ana, Juan Pablo\n欠席者：Marta');
    assert.deepEqual([...names.latin].sort(), ['ana', 'juan', 'marta', 'pablo']);
  });

  it('toma de la lista solo los katakana cuyo nombre latino es de la asistencia', () => {
    const text = [
      '出席者：Ana, Juan Pablo',
      'アナ：Ana',
      'フアン・パブロ：Juan Pablo',
      'パン：Pan',
      'スマホ：smart phone',
    ].join('\n');

    assert.deepEqual(
      [...collectPersonalNames(text).katakana].sort(),
      ['アナ', 'パブロ', 'フアン', 'フアン・パブロ'].sort(),
    );
  });

  it('toma el nombre en katakana de quien va delante de せんせい', () => {
    assert.deepEqual(collectPersonalNames('ケンジせんせい は にほんじん').katakana, ['ケンジ']);
  });

  it('no saca nombres de un texto de vocabulario', () => {
    assert.deepEqual(collectPersonalNames('パン：Pan\nねこ：gato'), { latin: [], katakana: [] });
  });
});
