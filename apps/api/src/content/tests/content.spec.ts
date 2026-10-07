import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toItemDetail, toItemSummary, type ItemDetailRow, type ItemSummaryRow } from '../helpers/to-dto.js';
import { buildTopicTree } from '../helpers/topic-tree.js';
import { idSchema, slugSchema } from '../schemas/params.schema.js';
import type { TopicTreeRow } from '../types/topic-tree.js';

const topic = (id: string, parentId: string | null, position: number, items = 0): TopicTreeRow => ({
  id,
  parentId,
  position,
  slug: id,
  name: id,
  description: null,
  category: 'VOCABULARY',
  _count: { items },
});

const section = (title: string, position: number, classDate: Date | null) => ({
  section: { title, position, classDate },
});

const kanjiRow: ItemSummaryRow = {
  id: 'ckanji0000000000000000001',
  type: 'KANJI',
  japanese: '日',
  reading: null,
  meaning: 'día, sol',
  example: null,
  kanji: { itemId: 'ckanji0000000000000000001', onyomi: ['ニチ'], kunyomi: ['ひ'], strokeCount: 4, jlptLevel: 5 },
  occurrences: [
    section('9/12 にちようび', 9, new Date(Date.UTC(2026, 8, 12))),
    section('7/10 はじめまして', 1, new Date(Date.UTC(2026, 6, 10))),
    section('repaso', 5, null),
  ],
  topics: [{ topic: { slug: 'fechas', name: 'Fechas' } }],
};

describe('buildTopicTree', () => {
  it('cuelga los subtemas de su padre y ordena ambos niveles por posición', () => {
    const tree = buildTopicTree([
      topic('b', null, 1),
      topic('a2', 'a', 1, 3),
      topic('a', null, 0, 2),
      topic('a1', 'a', 0),
      topic('b1', 'b', 0),
    ]);

    assert.deepEqual(
      tree.map((node) => [node.slug, node.itemCount, node.children.map((child) => child.slug)]),
      [
        ['a', 2, ['a1', 'a2']],
        ['b', 0, ['b1']],
      ],
    );
    assert.equal(tree[0]?.children[1]?.itemCount, 3);
  });

  it('no expone los campos internos', () => {
    const [node] = buildTopicTree([topic('a', null, 0)]);
    assert.deepEqual(Object.keys(node ?? {}).sort(), [
      'category',
      'children',
      'description',
      'itemCount',
      'name',
      'slug',
    ]);
  });
});

describe('toItemSummary', () => {
  it('ordena las clases por el curso, con la fecha sin hora', () => {
    assert.deepEqual(toItemSummary(kanjiRow).classes, [
      { title: '7/10 はじめまして', classDate: '2026-07-10' },
      { title: 'repaso', classDate: null },
      { title: '9/12 にちようび', classDate: '2026-09-12' },
    ]);
  });

  it('trae el tema primario y los datos del kanji sin el itemId', () => {
    const summary = toItemSummary(kanjiRow);
    assert.deepEqual(summary.primaryTopic, { slug: 'fechas', name: 'Fechas' });
    assert.deepEqual(summary.kanji, { onyomi: ['ニチ'], kunyomi: ['ひ'], strokeCount: 4, jlptLevel: 5 });
  });

  it('deja el tema primario en null si no hay ninguno', () => {
    assert.equal(toItemSummary({ ...kanjiRow, topics: [] }).primaryTopic, null);
  });
});

describe('toItemDetail', () => {
  it('pone el tema primario primero y el resto por nombre', () => {
    const row: ItemDetailRow = {
      ...kanjiRow,
      topics: [
        { isPrimary: false, topic: { slug: 'kanji', name: 'Kanji' } },
        { isPrimary: false, topic: { slug: 'calendario', name: 'Calendario' } },
        { isPrimary: true, topic: { slug: 'fechas', name: 'Fechas' } },
      ],
    };
    const detail = toItemDetail(row, []);

    assert.deepEqual(
      detail.topics.map((entry) => entry.slug),
      ['fechas', 'calendario', 'kanji'],
    );
    assert.deepEqual(detail.primaryTopic, { slug: 'fechas', name: 'Fechas' });
  });
});

describe('parámetros', () => {
  it('acepta slugs kebab-case y rechaza el resto', () => {
    assert.equal(slugSchema.safeParse('fechas-y-calendario').success, true);
    assert.equal(slugSchema.safeParse('Fechas').success, false);
    assert.equal(slugSchema.safeParse('a--b').success, false);
    assert.equal(slugSchema.safeParse("x' OR 1=1").success, false);
  });

  it('acepta IDs cuid', () => {
    assert.equal(idSchema.safeParse('cmuudkd1w000dsgo2rakqgcqq').success, true);
    assert.equal(idSchema.safeParse('../etc').success, false);
  });
});
