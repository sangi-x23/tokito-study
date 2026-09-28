import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { stripPersonalData } from './strip-personal-data';

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
});
