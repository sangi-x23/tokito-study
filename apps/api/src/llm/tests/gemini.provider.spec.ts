import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError, type GenerateContentParameters } from '@google/genai';
import { LlmValidationError } from '../llm.errors';
import { GeminiProvider, toGeminiParts } from '../providers/gemini.provider';
import type { GeminiResponse } from '../types/gemini';
import { fakeClock } from './fake-clock';

const SETTINGS = { model: 'gemini-de-prueba', minIntervalMs: 1000, maxRetries: 2 };

/** Proveedor con un `generate` de mentira que devuelve las respuestas en orden. */
function providerWith(responses: (GeminiResponse | Error)[]) {
  const calls: GenerateContentParameters[] = [];
  const { clock, sleeps } = fakeClock();

  const provider = new GeminiProvider({
    settings: SETTINGS,
    clock,
    random: () => 1,
    generate: async (params) => {
      calls.push(params);
      const next = responses.shift();
      if (!next) {
        throw new Error('no quedan respuestas de prueba');
      }
      if (next instanceof Error) {
        throw next;
      }
      return next;
    },
  });

  return { provider, calls, sleeps };
}

const json = (value: unknown): GeminiResponse => ({
  text: JSON.stringify(value),
  candidates: [{ finishReason: 'STOP' }],
});

const EXTRACTION = {
  items: [
    {
      type: 'WORD',
      japanese: 'ねこ',
      reading: null,
      meaning: 'gato',
      example: null,
      topicLabel: 'Animales',
      kanji: null,
    },
  ],
  imageTexts: [{ imageId: 'img-1', text: 'ねこ：gato' }],
};

describe('toGeminiParts', () => {
  it('precede cada imagen de su marca y la manda en base64', () => {
    const parts = toGeminiParts([
      { kind: 'text', text: 'Antes' },
      { kind: 'image', imageId: 'img-1', mimeType: 'image/png', data: Buffer.from('png') },
    ]);

    assert.deepEqual(parts, [
      { text: 'Antes' },
      { text: '[imagen img-1]' },
      { inlineData: { mimeType: 'image/png', data: Buffer.from('png').toString('base64') } },
    ]);
  });
});

describe('GeminiProvider', () => {
  const parts = [
    { kind: 'text' as const, text: 'ねこ：gato' },
    { kind: 'image' as const, imageId: 'img-1', mimeType: 'image/png', data: Buffer.from('x') },
  ];

  it('pide salida JSON con el esquema derivado de zod y devuelve la respuesta validada', async () => {
    const { provider, calls } = providerWith([json(EXTRACTION)]);

    const result = await provider.extractStudyItems(parts);

    assert.deepEqual(result, EXTRACTION);
    assert.equal(calls[0]?.model, 'gemini-de-prueba');
    assert.equal(calls[0]?.config?.responseMimeType, 'application/json');

    const schema = calls[0]?.config?.responseJsonSchema as { type?: string; $schema?: string };
    assert.equal(schema.type, 'object');
    assert.equal(schema.$schema, undefined);
  });

  it('lanza LlmValidationError si falta el texto de una imagen', async () => {
    const { provider } = providerWith([json({ ...EXTRACTION, imageTexts: [] })]);

    await assert.rejects(provider.extractStudyItems(parts), LlmValidationError);
  });

  it('lanza LlmValidationError si la respuesta no cumple el esquema', async () => {
    const { provider } = providerWith([json({ items: [{ type: 'VERBO' }], imageTexts: [] })]);

    await assert.rejects(provider.extractStudyItems([]), LlmValidationError);
  });

  it('avisa del JSON cortado por MAX_TOKENS', async () => {
    const { provider } = providerWith([{ text: '{"items": [', candidates: [{ finishReason: 'MAX_TOKENS' }] }]);

    await assert.rejects(provider.extractStudyItems([]), /MAX_TOKENS/);
  });

  it('reintenta un 503 y espacia las llamadas', async () => {
    const { provider, calls, sleeps } = providerWith([
      new ApiError({ status: 503, message: 'Service Unavailable' }),
      json({ items: [], imageTexts: [] }),
    ]);

    await provider.extractStudyItems([]);

    assert.equal(calls.length, 2);
    // Backoff de 2 s y, como ya pasó más del intervalo mínimo, sin espera del throttle.
    assert.deepEqual(sleeps, [2000]);
  });

  it('valida la taxonomía contra las etiquetas enviadas', async () => {
    const { provider } = providerWith([
      json({
        topics: [{ slug: 'comida', name: 'Comida', description: null, category: 'VOCABULARY', parentSlug: null }],
        labelMap: [],
      }),
    ]);

    await assert.rejects(
      provider.buildTaxonomy([{ label: 'Comida', examples: ['パン'] }]),
      /falta la etiqueta "Comida"/,
    );
  });

  it('manda el catálogo y los ítems en la asignación', async () => {
    const catalog = [{ slug: 'comida', name: 'Comida', category: 'VOCABULARY' as const, parentSlug: null }];
    const items = [{ key: 'k1', type: 'WORD' as const, japanese: 'パン', meaning: 'pan', topicLabel: 'Comida' }];
    const { provider, calls } = providerWith([
      json({ assignments: [{ key: 'k1', topicSlugs: ['comida'], primarySlug: 'comida' }], newTopics: [] }),
    ]);

    const result = await provider.assignToTopics(items, catalog);

    assert.equal(result.assignments[0]?.primarySlug, 'comida');
    const sent = JSON.stringify(calls[0]?.contents);
    assert.match(sent, /パン/);
    assert.match(sent, /comida/);
  });
});
