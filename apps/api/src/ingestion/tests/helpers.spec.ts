import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ParsedSection } from '../../google-docs';
import { parseClassDate } from '../helpers/class-date';
import { contentHash, sha256 } from '../helpers/content-hash';
import { collectLabels } from '../helpers/labels';
import { prepareSection, toLlmParts } from '../helpers/prepare-section';
import type { SectionExtraction } from '../types/import-plan';

describe('contentHash', () => {
  it('cambia si cambia una imagen aunque el texto sea el mismo', () => {
    const a = contentHash([{ kind: 'text', text: 'ねこ' }, { kind: 'image', hash: 'h1' }]);
    const b = contentHash([{ kind: 'text', text: 'ねこ' }, { kind: 'image', hash: 'h2' }]);
    assert.notEqual(a, b);
  });

  it('distingue el orden de las partes', () => {
    const a = contentHash([{ kind: 'text', text: 'a' }, { kind: 'image', hash: 'h' }]);
    const b = contentHash([{ kind: 'image', hash: 'h' }, { kind: 'text', text: 'a' }]);
    assert.notEqual(a, b);
  });

  it('es estable para el mismo contenido', () => {
    const parts = [{ kind: 'text' as const, text: 'a\nb' }];
    assert.equal(contentHash(parts), contentHash(parts));
  });
});

describe('parseClassDate', () => {
  const now = new Date(Date.UTC(2026, 9, 1));

  it('lee mes y día del principio del título', () => {
    assert.deepEqual(parseClassDate('7/10 はじめまして', now), new Date(Date.UTC(2026, 6, 10)));
  });

  it('usa el año anterior si la fecha quedaría en el futuro', () => {
    assert.deepEqual(parseClassDate('12/5 クリスマス', now), new Date(Date.UTC(2025, 11, 5)));
  });

  it('devuelve null si el título no empieza por una fecha', () => {
    assert.equal(parseClassDate('中間試験 Examen Parcial', now), null);
    assert.equal(parseClassDate('CURSO1 - Introduccion', now), null);
  });

  it('descarta fechas imposibles en vez de desbordar', () => {
    assert.equal(parseClassDate('2/31 algo', now), null);
    assert.equal(parseClassDate('13/1 algo', now), null);
  });
});

describe('prepareSection y toLlmParts', () => {
  const section: ParsedSection = {
    tabId: 't.1',
    title: 'Clase',
    position: 1,
    rawText: 'Antes',
    parts: [
      { kind: 'text', text: 'Antes' },
      { kind: 'image', objectId: 'o1', contentUri: 'uri-a' },
      { kind: 'image', objectId: 'o2', contentUri: 'uri-b' },
      { kind: 'image', objectId: 'o3', contentUri: 'uri-a-otra-vez' },
    ],
  };

  const files: Record<string, string> = { 'uri-a': 'AAA', 'uri-b': 'BBB', 'uri-a-otra-vez': 'AAA' };
  const download = async (uri: string) => ({ data: Buffer.from(files[uri] ?? ''), mimeType: 'image/png' });

  it('hashea el contenido descargado y deja una sola vez cada imagen repetida', async () => {
    const prepared = await prepareSection(section, download);

    assert.deepEqual(prepared.imageHashes, [sha256(Buffer.from('AAA')), sha256(Buffer.from('BBB'))]);
    assert.equal(prepared.parts.length, 3);
  });

  it('la huella no depende de la contentUri, que cambia en cada lectura', async () => {
    const otherUris: ParsedSection = {
      ...section,
      parts: section.parts.map((part) => (part.kind === 'image' ? { ...part, contentUri: `x-${part.contentUri}` } : part)),
    };
    const downloadSame = async (uri: string) => download(uri.replace(/^x-/, ''));

    const a = await prepareSection(section, download);
    const b = await prepareSection(otherUris, downloadSame);
    assert.equal(a.contentHash, b.contentHash);
  });

  it('sustituye por su texto las imágenes en caché y reduce solo las nuevas', async () => {
    const prepared = await prepareSection(section, download);
    const shrunk: string[] = [];
    const shrink = async (data: Buffer) => {
      shrunk.push(data.toString());
      return { data: Buffer.from('small'), mimeType: 'image/jpeg' };
    };

    const parts = await toLlmParts(prepared, new Map([[sha256(Buffer.from('AAA')), 'texto de A']]), shrink);

    assert.deepEqual(shrunk, ['BBB']);
    assert.equal(parts[1]?.kind, 'text');
    assert.match(parts[1]?.kind === 'text' ? parts[1].text : '', /texto de A/);
    assert.deepEqual(parts[2], {
      kind: 'image',
      imageId: sha256(Buffer.from('BBB')),
      mimeType: 'image/jpeg',
      data: Buffer.from('small'),
    });
  });
});

describe('collectLabels', () => {
  const extraction = (position: number, items: [string, string, string][]): SectionExtraction => ({
    tabId: `t.${position}`,
    title: '',
    position,
    contentHash: '',
    rawText: '',
    images: [],
    items: items.map(([japanese, meaning, topicLabel]) => ({
      type: 'WORD',
      japanese,
      reading: null,
      meaning,
      example: null,
      topicLabel,
      kanji: null,
    })),
  });

  it('agrupa por etiqueta en el orden del curso, con ejemplos sin repetir', () => {
    const labels = collectLabels([
      extraction(2, [['いぬ', 'perro', 'Animales']]),
      extraction(1, [
        ['ねこ', 'gato', 'Animales'],
        ['ねこ', 'gato', 'Animales'],
        ['パン', 'pan', 'Comida'],
      ]),
    ]);

    assert.deepEqual(labels, [
      { label: 'Animales', examples: ['ねこ (gato)', 'いぬ (perro)'] },
      { label: 'Comida', examples: ['パン (pan)'] },
    ]);
  });

  it('limita los ejemplos por etiqueta', () => {
    const many = Array.from({ length: 9 }, (_, i): [string, string, string] => [`w${i}`, 'x', 'Muchos']);
    assert.equal(collectLabels([extraction(1, many)])[0]?.examples.length, 5);
  });
});
