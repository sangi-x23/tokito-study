import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ExtractedItem, TopicAssignment } from '../../llm';
import { isAuthorized } from '../cron-secret.guard';
import { itemKey, normalizeJapanese } from '../helpers/item-key';
import {
  buildSectionPlan,
  toItemsToAssign,
  uniqueItems,
  type CatalogEntry,
  type SectionPlanInput,
} from '../helpers/section-plan';

const word = (japanese: string, topicLabel = 'Animales'): ExtractedItem => ({
  type: 'WORD',
  japanese,
  reading: null,
  meaning: japanese,
  example: null,
  topicLabel,
  kanji: null,
});

const kanji = (japanese: string): ExtractedItem => ({
  type: 'KANJI',
  japanese,
  reading: null,
  meaning: japanese,
  example: null,
  topicLabel: 'Fechas',
  kanji: { onyomi: ['ニチ'], kunyomi: ['ひ'], strokeCount: 4, jlptLevel: 5 },
});

const catalog: CatalogEntry[] = [
  { slug: 'vocabulario', name: 'Vocabulario', category: 'VOCABULARY', parentSlug: null, position: 0 },
  { slug: 'animales', name: 'Animales', category: 'VOCABULARY', parentSlug: 'vocabulario', position: 0 },
  { slug: 'comida', name: 'Comida', category: 'VOCABULARY', parentSlug: 'vocabulario', position: 1 },
  { slug: 'fechas', name: 'Fechas', category: 'VOCABULARY', parentSlug: null, position: 1 },
];

const section = { tabId: 't.20', title: '11/7 どうぶつ', position: 20, contentHash: 'h', rawText: 'ねこ' };

function input(overrides: Partial<SectionPlanInput>): SectionPlanInput {
  return {
    section,
    items: [],
    existingKeys: new Set(),
    assignment: { assignments: [], newTopics: [] },
    catalog,
    nextItemPosition: new Map(),
    images: [],
    now: new Date(Date.UTC(2026, 10, 8)),
    ...overrides,
  };
}

const assign = (key: string, topicSlugs: string[], primarySlug = topicSlugs[0] ?? ''): TopicAssignment['assignments'][number] => ({
  key,
  topicSlugs,
  primarySlug,
});

describe('normalizeJapanese', () => {
  it('quita espacios, el signo final y usa paréntesis de ancho completo', () => {
    assert.equal(normalizeJapanese(' おなまえ は？ '), 'おなまえは');
    assert.equal(normalizeJapanese('いいえ、ちがいます。'), 'いいえ、ちがいます');
    assert.equal(normalizeJapanese('ごはん(を)たべます'), 'ごはん（を）たべます');
    assert.equal(normalizeJapanese('ねこ　'), 'ねこ');
  });
});

describe('uniqueItems', () => {
  it('normaliza y deja la primera aparición de cada ítem', () => {
    const items = uniqueItems([word('ねこ。'), word('ねこ', 'Mascotas'), kanji('日')]);
    assert.deepEqual(
      items.map((item) => [item.japanese, item.topicLabel]),
      [
        ['ねこ', 'Animales'],
        ['日', 'Fechas'],
      ],
    );
  });
});

describe('buildSectionPlan', () => {
  it('no reasigna ni reescribe los ítems que ya existen, pero los cuenta como apariciones', () => {
    const items = [word('ねこ'), word('いぬ')];
    const plan = buildSectionPlan(
      input({
        items,
        existingKeys: new Set([itemKey('WORD', 'ねこ')]),
        assignment: { assignments: [assign('WORD:いぬ', ['animales'])], newTopics: [] },
      }),
    );

    assert.deepEqual(
      plan.plan.items.map((item) => item.japanese),
      ['いぬ'],
    );
    assert.deepEqual(
      plan.itemRefs.map((item) => item.japanese),
      ['ねこ', 'いぬ'],
    );
    assert.deepEqual(plan.plan.items[0]?.tabIds, ['t.20']);
  });

  it('pone el primario primero y los ítems nuevos al final de cada tema', () => {
    const plan = buildSectionPlan(
      input({
        items: [word('いぬ'), word('さかな')],
        assignment: {
          assignments: [assign('WORD:いぬ', ['animales']), assign('WORD:さかな', ['animales', 'comida'], 'comida')],
          newTopics: [],
        },
        nextItemPosition: new Map([['animales', 12]]),
      }),
    );

    assert.deepEqual(plan.plan.items[0]?.topics, [{ slug: 'animales', isPrimary: true, position: 12 }]);
    assert.deepEqual(plan.plan.items[1]?.topics, [
      { slug: 'comida', isPrimary: true, position: 0 },
      { slug: 'animales', isPrimary: false, position: 13 },
    ]);
  });

  it('pone los temas nuevos detrás de sus hermanos', () => {
    const plan = buildSectionPlan(
      input({
        items: [word('とり')],
        assignment: {
          assignments: [assign('WORD:とり', ['aves'])],
          newTopics: [
            { slug: 'aves', name: 'Aves', description: null, category: 'VOCABULARY', parentSlug: 'vocabulario' },
          ],
        },
      }),
    );

    assert.deepEqual(
      plan.plan.topics.map((topic) => [topic.slug, topic.position]),
      [['aves', 2]],
    );
  });

  it('crea el tema de kanji si un kanji nuevo no tiene ninguno', () => {
    const plan = buildSectionPlan(
      input({ items: [kanji('日')], assignment: { assignments: [assign('KANJI:日', ['fechas'])], newTopics: [] } }),
    );

    assert.deepEqual(
      plan.plan.topics.map((topic) => [topic.slug, topic.category, topic.position]),
      [['kanji', 'KANJI', 2]],
    );
    assert.deepEqual(
      plan.plan.items[0]?.topics.map((topic) => topic.slug),
      ['fechas', 'kanji'],
    );
  });

  it('reutiliza el tema de kanji del catálogo', () => {
    const withKanji: CatalogEntry[] = [
      ...catalog,
      { slug: 'kanji-basicos', name: 'Kanji básicos', category: 'KANJI', parentSlug: null, position: 2 },
    ];
    const plan = buildSectionPlan(
      input({
        catalog: withKanji,
        items: [kanji('月')],
        assignment: { assignments: [assign('KANJI:月', ['fechas'])], newTopics: [] },
      }),
    );

    assert.deepEqual(plan.plan.topics, []);
    assert.deepEqual(
      plan.plan.items[0]?.topics.map((topic) => topic.slug),
      ['fechas', 'kanji-basicos'],
    );
  });

  it('falla si falta la asignación de un ítem nuevo', () => {
    assert.throws(() => buildSectionPlan(input({ items: [word('いぬ')] })), /falta la asignación de "いぬ"/);
  });

  it('saca la fecha de la clase del título', () => {
    const plan = buildSectionPlan(input({}));
    assert.deepEqual(plan.plan.sections[0]?.classDate, new Date(Date.UTC(2026, 10, 7)));
  });
});

describe('toItemsToAssign', () => {
  it('usa una clave que casa con la del plan', () => {
    assert.deepEqual(
      toItemsToAssign([word('いぬ')]).map((item) => item.key),
      ['WORD:いぬ'],
    );
  });
});

describe('isAuthorized', () => {
  const secret = 'un-secreto-de-prueba-largo';

  it('acepta solo el header exacto', () => {
    assert.equal(isAuthorized(`Bearer ${secret}`, secret), true);
    assert.equal(isAuthorized(secret, secret), false);
    assert.equal(isAuthorized(`Bearer ${secret}x`, secret), false);
    assert.equal(isAuthorized(undefined, secret), false);
  });
});
