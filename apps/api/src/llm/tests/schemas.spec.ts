import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkAssignment } from '../schemas/assignment.schema';
import { checkTopicTree } from '../schemas/common';
import { checkExtraction } from '../schemas/extraction.schema';
import { checkTaxonomy } from '../schemas/taxonomy.schema';
import type { ExtractedItem, ProposedTopic } from '../types/llm-provider';

const word = (japanese: string): ExtractedItem => ({
  type: 'WORD',
  japanese,
  reading: null,
  meaning: 'algo',
  example: null,
  topicLabel: 'Comida',
  kanji: null,
});

const kanji = (japanese: string): ExtractedItem => ({
  ...word(japanese),
  type: 'KANJI',
  kanji: { onyomi: ['ニチ'], kunyomi: ['ひ'], strokeCount: 4, jlptLevel: 5 },
});

const topic = (slug: string, parentSlug: string | null = null): ProposedTopic => ({
  slug,
  name: slug,
  description: null,
  category: 'VOCABULARY',
  parentSlug,
});

describe('checkExtraction', () => {
  it('acepta una extracción coherente', () => {
    const result = { items: [word('ねこ'), kanji('日')], imageTexts: [{ imageId: 'a', text: 'ねこ' }] };
    assert.deepEqual(checkExtraction(result, ['a']), []);
  });

  it('exige lecturas en los KANJI y las prohíbe en el resto', () => {
    const issues = checkExtraction(
      { items: [{ ...kanji('日'), kanji: null }, { ...kanji('月'), type: 'WORD' }], imageTexts: [] },
      [],
    );
    assert.equal(issues.length, 2);
  });

  it('rechaza un ítem KANJI de más de un carácter', () => {
    const issues = checkExtraction({ items: [kanji('日本')], imageTexts: [] }, []);
    assert.match(issues[0] ?? '', /un solo kanji/);
  });

  it('exige un texto por imagen, ni más ni menos', () => {
    const issues = checkExtraction(
      {
        items: [],
        imageTexts: [
          { imageId: 'a', text: 'x' },
          { imageId: 'a', text: 'y' },
          { imageId: 'z', text: 'z' },
        ],
      },
      ['a', 'b'],
    );

    assert.equal(issues.length, 3);
  });
});

describe('checkTopicTree', () => {
  it('acepta un árbol de dos niveles', () => {
    assert.deepEqual(checkTopicTree([topic('fechas'), topic('meses', 'fechas')]), []);
  });

  it('rechaza slugs que no son kebab-case ASCII', () => {
    assert.equal(checkTopicTree([topic('Días'), topic('dias_semana')]).length, 2);
  });

  it('rechaza slugs repetidos y padres que no existen', () => {
    assert.equal(checkTopicTree([topic('a'), topic('a'), topic('b', 'nada')]).length, 2);
  });

  it('rechaza un tercer nivel', () => {
    const issues = checkTopicTree([topic('a'), topic('b', 'a'), topic('c', 'b')]);
    assert.match(issues.join(), /3 niveles/);
  });

  it('detecta ciclos', () => {
    assert.match(checkTopicTree([topic('a', 'b'), topic('b', 'a')]).join(), /ciclo/);
  });
});

describe('checkTaxonomy', () => {
  const labels = [
    { label: 'Comida', examples: ['パン'] },
    { label: 'Bebidas', examples: ['おちゃ'] },
  ];

  it('acepta un mapeo completo', () => {
    const result = {
      topics: [topic('comida-y-bebida')],
      labelMap: [
        { label: 'Comida', topicSlug: 'comida-y-bebida' },
        { label: 'Bebidas', topicSlug: 'comida-y-bebida' },
      ],
    };

    assert.deepEqual(checkTaxonomy(result, labels), []);
  });

  it('detecta etiquetas que faltan, sobran, se repiten o apuntan a un tema inexistente', () => {
    const result = {
      topics: [topic('comida')],
      labelMap: [
        { label: 'Comida', topicSlug: 'comida' },
        { label: 'Comida', topicSlug: 'comida' },
        { label: 'Inventada', topicSlug: 'nada' },
      ],
    };

    const issues = checkTaxonomy(result, labels);
    assert.match(issues.join('\n'), /más de una vez/);
    assert.match(issues.join('\n'), /no es ninguna de las etiquetas/);
    assert.match(issues.join('\n'), /"nada", que no está/);
    assert.match(issues.join('\n'), /falta la etiqueta "Bebidas"/);
  });
});

describe('checkAssignment', () => {
  const catalog = [{ slug: 'fechas', name: 'Fechas', category: 'VOCABULARY' as const, parentSlug: null }];
  const items = [{ key: 'k1', type: 'WORD' as const, japanese: 'げつようび', meaning: 'lunes', topicLabel: 'Días' }];

  it('acepta reutilizar el catálogo y colgar un tema nuevo de él', () => {
    const result = {
      assignments: [{ key: 'k1', topicSlugs: ['dias-de-la-semana'], primarySlug: 'dias-de-la-semana' }],
      newTopics: [topic('dias-de-la-semana', 'fechas')],
    };

    assert.deepEqual(checkAssignment(result, items, catalog), []);
  });

  it('rechaza un tema nuevo que repite un slug del catálogo', () => {
    const result = {
      assignments: [{ key: 'k1', topicSlugs: ['fechas'], primarySlug: 'fechas' }],
      newTopics: [topic('fechas')],
    };

    assert.match(checkAssignment(result, items, catalog).join(), /ya existe en el catálogo/);
  });

  it('exige que el primario esté entre los temas y que todos existan', () => {
    const result = {
      assignments: [{ key: 'k1', topicSlugs: ['nada'], primarySlug: 'fechas' }],
      newTopics: [],
    };

    const issues = checkAssignment(result, items, catalog).join('\n');
    assert.match(issues, /primario/);
    assert.match(issues, /"nada", que no existe/);
  });

  it('detecta ítems sin asignar o asignados sin temas', () => {
    assert.match(checkAssignment({ assignments: [], newTopics: [] }, items, catalog).join(), /falta el ítem "k1"/);

    const empty = { assignments: [{ key: 'k1', topicSlugs: [], primarySlug: 'fechas' }], newTopics: [] };
    assert.match(checkAssignment(empty, items, catalog).join(), /no tiene ningún tema/);
  });
});
