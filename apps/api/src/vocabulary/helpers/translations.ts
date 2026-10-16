import { createHash } from 'node:crypto';
import type { Translation, TranslationResponse } from '../schemas/translation.schema.js';
import type { JmdictExample, TranslationRequest, VocabularySource } from '../types/vocabulary.js';

/** Una traducción al español de Tatoeba, por el ID de la oración en japonés. */
export type TatoebaSpanish = ReadonlyMap<number, { readonly id: number; readonly text: string }>;

const MAX_EXAMPLES = 2;

// Las primeras acepciones son las usuales: los ejemplos salen de ellas.
const EXAMPLE_SENSES = 3;

/**
 * Hasta dos ejemplos de las primeras acepciones, primero los que ya tienen
 * traducción humana en Tatoeba y, entre iguales, en el orden de JMdict.
 */
export function selectExamples(source: VocabularySource, spanish: TatoebaSpanish): JmdictExample[] {
  const candidates = source.senses.slice(0, EXAMPLE_SENSES).flatMap((sense) => sense.examples);
  const unique = [...new Map(candidates.map((example) => [example.tatoebaId, example])).values()];
  return unique
    .map((example, index) => ({ example, index, human: spanish.has(example.tatoebaId) }))
    .sort((a, b) => Number(b.human) - Number(a.human) || a.index - b.index)
    .slice(0, MAX_EXAMPLES)
    .map(({ example }) => example);
}

/** Los ejemplos de una palabra por su ID de Tatoeba. */
export const examplesById = (source: VocabularySource): Map<number, JmdictExample> =>
  new Map(source.senses.flatMap((sense) => sense.examples.map((example) => [example.tatoebaId, example])));

/**
 * Huella del inglés que se tradujo: las acepciones y los ejemplos elegidos.
 * No incluye el español de Tatoeba, que el seed no descarga.
 */
export function translationSource(source: VocabularySource, examples: readonly JmdictExample[]): string {
  const content = JSON.stringify({
    senses: source.senses.map((sense) => [sense.partsOfSpeech, sense.misc, sense.glosses, sense.info]),
    examples: examples.map((example) => [example.tatoebaId, example.japanese, example.english]),
  });
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Los ejemplos de JMdict que eligió la traducción, o null si la traducción
 * salió de un inglés que JMdict ya cambió.
 */
export function currentExamples(source: VocabularySource, translation: Translation): JmdictExample[] | null {
  const examples = examplesById(source);
  const chosen = translation.examples.flatMap((example) => examples.get(example.tatoebaId) ?? []);
  return chosen.length === translation.examples.length && translationSource(source, chosen) === translation.source
    ? chosen
    : null;
}

export function buildTranslationRequest(source: VocabularySource, spanish: TatoebaSpanish): TranslationRequest {
  return {
    key: source.key,
    level: source.level,
    japanese: source.japanese,
    reading: source.reading,
    senses: source.senses.map((sense) => ({
      partsOfSpeech: sense.partsOfSpeech,
      misc: sense.misc,
      glosses: sense.glosses,
      info: sense.info,
    })),
    examples: selectExamples(source, spanish).map((example) => {
      const human = spanish.get(example.tatoebaId);
      return human ? { ...example, spanish: human.text, spanishTatoebaId: human.id } : example;
    }),
  };
}

/**
 * Une la respuesta de quien tradujo con su solicitud. Los ejemplos que ya
 * tenían traducción de Tatoeba la conservan, diga lo que diga la respuesta.
 * Falla si la respuesta no trae exactamente los ejemplos pedidos.
 */
export function mergeTranslation(
  source: VocabularySource,
  request: TranslationRequest,
  response: TranslationResponse,
): Translation {
  const answered = new Map(response.examples.map((example) => [example.tatoebaId, example.spanish]));
  const examples = request.examples.map((example) => {
    if (example.spanish !== undefined && example.spanishTatoebaId !== undefined) {
      return { tatoebaId: example.tatoebaId, spanish: example.spanish, spanishTatoebaId: example.spanishTatoebaId };
    }
    const spanish = answered.get(example.tatoebaId);
    if (!spanish) {
      throw new Error(`${request.key}: falta la traducción del ejemplo ${example.tatoebaId}`);
    }
    return { tatoebaId: example.tatoebaId, spanish, spanishTatoebaId: null };
  });
  const requested = new Set(request.examples.map((example) => example.tatoebaId));
  const extra = response.examples.filter((example) => !requested.has(example.tatoebaId));
  if (extra.length > 0) {
    throw new Error(`${request.key}: traduce ejemplos que no se pidieron (${extra.map((e) => e.tatoebaId).join(', ')})`);
  }

  const chosen = request.examples.map((example) => examplesById(source).get(example.tatoebaId)!);
  return {
    key: request.key,
    source: translationSource(source, chosen),
    equivalents: response.equivalents,
    meaning: response.meaning,
    examples,
  };
}
