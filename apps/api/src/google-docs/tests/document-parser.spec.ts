import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { docs_v1 } from 'googleapis';
import { parseDocument } from '../helpers/document-parser.js';

function paragraph(...elements: docs_v1.Schema$ParagraphElement[]): docs_v1.Schema$StructuralElement {
  return { paragraph: { elements } };
}

const text = (content: string): docs_v1.Schema$ParagraphElement => ({ textRun: { content } });
const image = (inlineObjectId: string): docs_v1.Schema$ParagraphElement => ({
  inlineObjectElement: { inlineObjectId },
});

function inlineObject(contentUri: string): docs_v1.Schema$InlineObject {
  return { inlineObjectProperties: { embeddedObject: { imageProperties: { contentUri } } } };
}

function tab(
  tabId: string,
  title: string,
  content: docs_v1.Schema$StructuralElement[],
  options: {
    index?: number;
    inlineObjects?: Record<string, docs_v1.Schema$InlineObject>;
    childTabs?: docs_v1.Schema$Tab[];
  } = {},
): docs_v1.Schema$Tab {
  return {
    tabProperties: { tabId, title, index: options.index ?? 0 },
    documentTab: { body: { content }, inlineObjects: options.inlineObjects ?? {} },
    ...(options.childTabs ? { childTabs: options.childTabs } : {}),
  };
}

const doc = (tabs: docs_v1.Schema$Tab[]): docs_v1.Schema$Document => ({
  documentId: 'doc-1',
  title: 'Diario del curso',
  revisionId: 'rev-1',
  tabs,
});

describe('parseDocument', () => {
  it('intercala texto e imágenes en el orden original', () => {
    const parsed = parseDocument(
      doc([
        tab('t1', 'Clase 1', [paragraph(text('Antes\n'), image('img-1'), text('Después\n'))], {
          inlineObjects: { 'img-1': inlineObject('https://example.com/a.png') },
        }),
      ]),
    );

    const section = parsed.sections[0];
    assert.ok(section);
    assert.deepEqual(section.parts, [
      { kind: 'text', text: 'Antes' },
      { kind: 'image', objectId: 'img-1', contentUri: 'https://example.com/a.png' },
      { kind: 'text', text: 'Después' },
    ]);
  });

  it('rawText junta solo el texto, sin las imágenes', () => {
    const parsed = parseDocument(
      doc([
        tab('t1', 'Clase 1', [paragraph(text('Uno\n'), image('img-1'), text('Dos\n'))], {
          inlineObjects: { 'img-1': inlineObject('https://example.com/a.png') },
        }),
      ]),
    );

    assert.equal(parsed.sections[0]?.rawText, 'Uno\n\nDos');
  });

  it('ignora una imagen sin contentUri en vez de romperse', () => {
    const parsed = parseDocument(
      doc([tab('t1', 'Clase 1', [paragraph(text('Hola\n'), image('huerfana'))])]),
    );

    assert.deepEqual(parsed.sections[0]?.parts, [{ kind: 'text', text: 'Hola' }]);
  });

  it('aplana las pestañas hijas en profundidad y respeta el índice', () => {
    const parsed = parseDocument(
      doc([
        tab('b', 'Segunda', [paragraph(text('b\n'))], { index: 1 }),
        tab('a', 'Primera', [paragraph(text('a\n'))], {
          index: 0,
          childTabs: [tab('a1', 'Primera-hija', [paragraph(text('a1\n'))])],
        }),
      ]),
    );

    assert.deepEqual(
      parsed.sections.map((section) => [section.position, section.tabId]),
      [
        [0, 'a'],
        [1, 'a1'],
        [2, 'b'],
      ],
    );
  });

  it('descarta una pestaña sin tabId, que no tendría clave natural', () => {
    const sinId: docs_v1.Schema$Tab = {
      tabProperties: { title: 'Rota', index: 0 },
      documentTab: { body: { content: [paragraph(text('algo\n'))] } },
    };

    assert.equal(parseDocument(doc([sinId])).sections.length, 0);
  });

  it('convierte una tabla en filas con columnas separadas', () => {
    const table: docs_v1.Schema$StructuralElement = {
      table: {
        tableRows: [
          {
            tableCells: [
              { content: [paragraph(text('日\n'))] },
              { content: [paragraph(text('ひ\n'))] },
              { content: [paragraph(text('día\n'))] },
            ],
          },
        ],
      },
    };

    assert.equal(parseDocument(doc([tab('t1', 'Vocabulario', [table])])).sections[0]?.rawText, '日 | ひ | día');
  });

  it('aplica el descarte de datos personales al texto de la sección', () => {
    const parsed = parseDocument(
      doc([
        tab('t1', 'Clase 1', [
          paragraph(text('Clase 1\n')),
          paragraph(text('https://meet.google.com/abc-defg-hij\n')),
          paragraph(text('Vocabulario\n')),
        ]),
      ]),
    );

    assert.equal(parsed.sections[0]?.rawText, 'Clase 1\nVocabulario');
  });

  it('salta las pestañas pedidas pero usa sus nombres para limpiar las demás', () => {
    const parsed = parseDocument(
      doc([
        tab('t.0', 'Introducción', [paragraph(text('アナ：Ana\n'))], { index: 0 }),
        tab('t.1', 'Clase 1', [paragraph(text('出席者：Ana\nわたしは　アナです。\nねこ：gato\n'))], {
          index: 1,
        }),
      ]),
      { skipTabIds: ['t.0'] },
    );

    assert.deepEqual(
      parsed.sections.map((section) => section.tabId),
      ['t.1'],
    );
    assert.equal(parsed.sections[0]?.position, 1);
    assert.equal(parsed.sections[0]?.rawText, 'ねこ：gato');
  });

  it('descarta una parte de texto que se queda vacía al limpiarla', () => {
    const parsed = parseDocument(
      doc([
        tab('t1', 'Clase 1', [paragraph(text('出席者：Ana\n'), image('img-1'), text('ねこ\n'))], {
          inlineObjects: { 'img-1': inlineObject('https://example.com/a.png') },
        }),
      ]),
    );

    assert.deepEqual(
      parsed.sections[0]?.parts.map((part) => part.kind),
      ['image', 'text'],
    );
  });

  it('conserva los metadatos del documento', () => {
    const parsed = parseDocument(doc([]));

    assert.equal(parsed.documentId, 'doc-1');
    assert.equal(parsed.title, 'Diario del curso');
    assert.equal(parsed.revisionId, 'rev-1');
    assert.deepEqual(parsed.sections, []);
  });
});
