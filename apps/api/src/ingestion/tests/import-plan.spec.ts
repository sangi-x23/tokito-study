import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ExtractedItem, ProposedTopic, Taxonomy } from '../../llm/index.js';
import { buildImportPlan } from '../helpers/import-plan.js';
import type { SectionExtraction } from '../types/import-plan.js';

const NOW = new Date(Date.UTC(2026, 9, 1));

const item = (japanese: string, topicLabel: string, overrides: Partial<ExtractedItem> = {}): ExtractedItem => ({
  type: 'WORD',
  japanese,
  reading: null,
  meaning: `significado de ${japanese}`,
  example: null,
  topicLabel,
  kanji: null,
  ...overrides,
});

const kanji = (japanese: string, topicLabel: string): ExtractedItem =>
  item(japanese, topicLabel, {
    type: 'KANJI',
    kanji: { onyomi: ['ニチ'], kunyomi: ['ひ'], strokeCount: 4, jlptLevel: 5 },
  });

const section = (position: number, items: ExtractedItem[], images: SectionExtraction['images'] = []): SectionExtraction => ({
  tabId: `t.${position}`,
  title: `${position}/1${position} clase`,
  position,
  contentHash: `hash-${position}`,
  rawText: '',
  items,
  images,
});

const topic = (slug: string, parentSlug: string | null = null, category: ProposedTopic['category'] = 'VOCABULARY'): ProposedTopic => ({
  slug,
  name: slug,
  description: null,
  category,
  parentSlug,
});

const taxonomy = (topics: ProposedTopic[], labels: Record<string, string>): Taxonomy => ({
  topics,
  labelMap: Object.entries(labels).map(([label, topicSlug]) => ({ label, topicSlug })),
});

describe('buildImportPlan', () => {
  const tax = taxonomy([topic('vocab'), topic('animales', 'vocab'), topic('comida', 'vocab')], {
    Animales: 'animales',
    Mascotas: 'animales',
    Comida: 'comida',
  });

  it('fusiona un ítem repetido entre pestañas y conserva los datos de la primera clase', () => {
    const plan = buildImportPlan(
      [
        section(2, [item('ねこ', 'Comida', { meaning: 'otro significado' })]),
        section(1, [item('ねこ', 'Animales', { meaning: 'gato' })]),
      ],
      tax,
      NOW,
    );

    assert.equal(plan.items.length, 1);
    assert.equal(plan.items[0]?.meaning, 'gato');
    assert.deepEqual(plan.items[0]?.tabIds, ['t.1', 't.2']);
    assert.deepEqual(plan.items[0]?.topics.map((t) => [t.slug, t.isPrimary]), [
      ['animales', true],
      ['comida', false],
    ]);
  });

  it('no duplica por espacios o forma Unicode distintos', () => {
    const plan = buildImportPlan(
      [section(1, [item('ねこ ', 'Animales'), item('ねこ', 'Mascotas')])],
      tax,
      NOW,
    );

    assert.equal(plan.items.length, 1);
    assert.equal(plan.items[0]?.japanese, 'ねこ');
    assert.equal(plan.items[0]?.topics.length, 1);
  });

  it('numera los ítems dentro de cada tema en el orden del curso', () => {
    const plan = buildImportPlan(
      [section(1, [item('ねこ', 'Animales'), item('パン', 'Comida'), item('いぬ', 'Mascotas')])],
      tax,
      NOW,
    );

    const positions = plan.items.map((entry) => [entry.japanese, entry.topics[0]?.position]);
    assert.deepEqual(positions, [
      ['ねこ', 0],
      ['パン', 0],
      ['いぬ', 1],
    ]);
  });

  it('numera los temas entre sus hermanos', () => {
    const plan = buildImportPlan([section(1, [])], tax, NOW);
    assert.deepEqual(plan.topics.map((t) => [t.slug, t.position]), [
      ['vocab', 0],
      ['animales', 0],
      ['comida', 1],
    ]);
  });

  it('crea el tema de kanji si hay kanji y la taxonomía no trae ninguno', () => {
    const plan = buildImportPlan([section(1, [kanji('日', 'Animales')])], tax, NOW);

    assert.ok(plan.topics.some((t) => t.slug === 'kanji' && t.category === 'KANJI'));
    assert.deepEqual(plan.items[0]?.topics.map((t) => [t.slug, t.isPrimary]), [
      ['animales', true],
      ['kanji', false],
    ]);
  });

  it('usa el tema de kanji de la taxonomía si ya existe', () => {
    const withKanji = taxonomy([...tax.topics, topic('kanji-basico', null, 'KANJI')], tax.labelMap.reduce(
      (acc, entry) => ({ ...acc, [entry.label]: entry.topicSlug }),
      {} as Record<string, string>,
    ));
    const plan = buildImportPlan([section(1, [kanji('日', 'Animales')])], withKanji, NOW);

    assert.equal(plan.topics.filter((t) => t.category === 'KANJI').length, 1);
    assert.equal(plan.items[0]?.topics[1]?.slug, 'kanji-basico');
  });

  it('no crea el tema de kanji si no hay kanji', () => {
    const plan = buildImportPlan([section(1, [item('ねこ', 'Animales')])], tax, NOW);
    assert.ok(!plan.topics.some((t) => t.slug === 'kanji'));
  });

  it('falla si una etiqueta no tiene tema, en vez de dejar un ítem sin clasificar', () => {
    assert.throws(
      () => buildImportPlan([section(1, [item('ねこ', 'Inventada')])], tax, NOW),
      /"Inventada".*no está en labelMap/,
    );
  });

  it('falla si la taxonomía editada rompe el árbol', () => {
    const broken = taxonomy([topic('animales', 'no-existe')], { Animales: 'animales' });
    assert.throws(() => buildImportPlan([section(1, [item('ねこ', 'Animales')])], broken, NOW), /no existe/);
  });

  it('saca la fecha de clase del título y junta las imágenes sin repetir', () => {
    const plan = buildImportPlan(
      [
        section(1, [], [{ hash: 'h1', text: 'uno' }]),
        section(2, [], [{ hash: 'h1', text: 'uno' }, { hash: 'h2', text: 'dos' }]),
      ],
      tax,
      NOW,
    );

    assert.deepEqual(plan.sections[0]?.classDate, new Date(Date.UTC(2026, 0, 11)));
    assert.deepEqual(plan.images.map((image) => image.hash), ['h1', 'h2']);
  });
});
