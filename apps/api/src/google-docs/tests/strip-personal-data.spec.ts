import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  collectPersonalNames,
  NO_PERSONAL_NAMES,
  stripPersonalData,
  withPersonalTerms,
} from '../helpers/strip-personal-data.js';

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
    const names = { latin: ['ana', 'lisa'], katakana: ['リサ', 'ケンジ'] };
    const input = [
      'わたしは　リサです。',
      'ケンジちゃんの　おかあさん',
      'La mamá de Ana',
      'LISAIKURU：リサイクル：reciclaje',
      'BANANA：バナナ：banano',
    ].join('\n');

    assert.equal(stripPersonalData(input, names), 'LISAIKURU：リサイクル：reciclaje\nBANANA：バナナ：banano');
  });

  it('quita a quien dice su nombre o apellido y deja la plantilla y la pregunta', () => {
    const input = [
      'わたし　の　みょうじ　は　ゴメス　です。',
      'わたしのなまえは Pedro です。',
      'わたしのなまえは 〇〇です。',
      'おなまえ　は　なんですか？',
      'なまえ (nombre)… わたしは nombre です。',
    ].join('\n');

    assert.equal(
      stripPersonalData(input),
      'わたしのなまえは 〇〇です。\nおなまえ　は　なんですか？\nなまえ (nombre)… わたしは nombre です。',
    );
  });

  it('quita a quien dice dónde vive y deja la plantilla, la pregunta y el libro', () => {
    const input = [
      'わたしは　ソルナレスに　すんでいます。',
      '→  Yo vivo en Solnares.',
      'わたしの　ははは　ミラフロルに　すんでいます。',
      '（ Persona ）は　（ Lugar ）に　すんでいます。',
      'わたしは（ Lugar ）にすんでいます。→ Yo vivo en (Lugar).',
      '［　］は［　］に すんでいます。',
      'どこに　すんでいますか。→ ¿Dónde vives?',
      'アランさんは　ロンドンに　すんでいます。',
      'すんでいます：vivo',
    ].join('\n');

    assert.equal(
      stripPersonalData(input),
      [
        '（ Persona ）は　（ Lugar ）に　すんでいます。',
        'わたしは（ Lugar ）にすんでいます。→ Yo vivo en (Lugar).',
        '［　］は［　］に すんでいます。',
        'どこに　すんでいますか。→ ¿Dónde vives?',
        'アランさんは　ロンドンに　すんでいます。',
        'すんでいます：vivo',
      ].join('\n'),
    );
  });

  it('quita los términos configurados: latinos como palabra completa, el resto literal', () => {
    const names = withPersonalTerms(NO_PERSONAL_NAMES, ['Pepa', 'すてきなカフェ']);
    const input = [
      'は：El tema es sobre Pepa',
      'わたし　は　すてきなカフェのオーナーです。',
      'Pepasa：un plato',
      'カフェ：café',
    ].join('\n');

    assert.equal(stripPersonalData(input, names), 'Pepasa：un plato\nカフェ：café');
  });
});

describe('collectPersonalNames', () => {
  it('saca los nombres latinos de la asistencia, sin el 全員', () => {
    const names = collectPersonalNames('出席者：全員 Ana, Luis Carlos\n欠席者：Marta');
    assert.deepEqual([...names.latin].sort(), ['ana', 'carlos', 'luis', 'marta']);
  });

  it('toma de la lista solo los katakana cuyo nombre latino es de la asistencia', () => {
    const text = [
      '出席者：Ana, Luis Carlos',
      'アナ：Ana',
      'ルイス・カルロス：Luis Carlos',
      'パン：Pan',
      'スマホ：smart phone',
    ].join('\n');

    assert.deepEqual(
      [...collectPersonalNames(text).katakana].sort(),
      ['アナ', 'カルロス', 'ルイス', 'ルイス・カルロス'].sort(),
    );
  });

  it('toma el nombre en katakana de quien va delante de せんせい', () => {
    assert.deepEqual(collectPersonalNames('ケンジせんせい は にほんじん').katakana, ['ケンジ']);
  });

  it('toma el nombre latino de un profesor escrito en los dos alfabetos', () => {
    const names = collectPersonalNames('山田ケンジ ／ Yamada Kenji\nケンジせんせい\nパン / Pan');
    assert.deepEqual([...names.latin].sort(), ['kenji', 'yamada']);
  });

  it('no saca nombres de un texto de vocabulario', () => {
    assert.deepEqual(collectPersonalNames('パン：Pan\nねこ：gato'), { latin: [], katakana: [] });
  });
});
