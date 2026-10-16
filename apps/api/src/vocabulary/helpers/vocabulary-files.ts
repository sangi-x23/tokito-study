import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { JlptLevel } from '@tokito/shared';
import { z } from 'zod';
import { translationFileSchema, type Translation } from '../schemas/translation.schema.js';
import type { TranslationRequest, VocabularySource, WallerWord } from '../types/vocabulary.js';
import { JMDICT_URL, parseJmdict } from './jmdict.js';
import type { TatoebaSpanish } from './translations.js';
import { buildVocabularySources } from './vocabulary-sources.js';
import { WALLER_CORRECTIONS } from './waller-corrections.js';
import { correctWallerWords, JLPT_LEVELS, parseWallerCsv, wallerUrl } from './waller.js';

/**
 * Las traducciones al español, una por nivel, en `apps/api/data/vocabulary/`.
 * Van en el repo porque no se pueden regenerar sin traducir otra vez, y fuera
 * de `src/` para no entrar en la función de Vercel.
 */
export const TRANSLATIONS_DIR = resolve(import.meta.dirname, '../../../data/vocabulary');

/**
 * Los lotes de trabajo de `vocab:translate`, en `apps/api/.vocabulary/`
 * (ignorado por git): solicitudes, respuestas y las exportaciones de Tatoeba.
 */
export const WORK_DIR = resolve(import.meta.dirname, '../../../.vocabulary');
export const REQUESTS_DIR = join(WORK_DIR, 'requests');
export const RESPONSES_DIR = join(WORK_DIR, 'responses');
const TATOEBA_DIR = join(WORK_DIR, 'tatoeba');

const translationsFile = (level: JlptLevel): string => join(TRANSLATIONS_DIR, `n${level}.json`);

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} respondió ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Baja las listas y JMdict y los une, de N5 a N1. */
export async function downloadVocabularySources(): Promise<VocabularySource[]> {
  console.log('Descargando las listas del JLPT…');
  const words: WallerWord[] = [];
  for (const level of JLPT_LEVELS) {
    words.push(...parseWallerCsv((await download(wallerUrl(level))).toString('utf8'), level));
  }
  const corrected = correctWallerWords(words, WALLER_CORRECTIONS);
  console.log('Descargando JMdict…');
  const xml = gunzipSync(await download(JMDICT_URL)).toString('utf8');
  return buildVocabularySources(corrected, parseJmdict(xml, new Set(corrected.map((word) => word.seq))));
}

/** Las traducciones guardadas, por clave. Un nivel sin archivo cuenta como vacío. */
export async function readTranslations(): Promise<Map<string, Translation>> {
  const translations = new Map<string, Translation>();
  for (const level of JLPT_LEVELS) {
    let raw: string;
    try {
      raw = await readFile(translationsFile(level), 'utf8');
    } catch {
      continue;
    }
    const result = translationFileSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      throw new Error(`${translationsFile(level)} no tiene la forma esperada:\n${z.prettifyError(result.error)}`);
    }
    for (const translation of result.data) {
      translations.set(translation.key, translation);
    }
  }
  return translations;
}

/** Reescribe los archivos de traducciones, cada palabra en su nivel y en el orden de las listas. */
export async function writeTranslations(
  sources: readonly VocabularySource[],
  translations: ReadonlyMap<string, Translation>,
): Promise<void> {
  await mkdir(TRANSLATIONS_DIR, { recursive: true });
  for (const level of JLPT_LEVELS) {
    const entries = sources
      .filter((source) => source.level === level)
      .flatMap((source) => translations.get(source.key) ?? []);
    // Una entrada por línea: los diffs muestran solo las palabras que cambian.
    const body = entries.map((entry) => `  ${JSON.stringify(entry)}`).join(',\n');
    await writeFile(translationsFile(level), `[\n${body}\n]\n`, 'utf8');
  }
}

/**
 * Las traducciones de Tatoeba al español, a partir de dos exportaciones
 * descomprimidas en `.vocabulary/tatoeba/` (ver `vocab:translate`). Si una
 * oración tiene varias, se queda la de menor ID.
 */
export async function readTatoebaSpanish(): Promise<TatoebaSpanish> {
  const read = async (name: string): Promise<string[][]> => {
    try {
      const raw = await readFile(join(TATOEBA_DIR, name), 'utf8');
      return raw.split('\n').filter(Boolean).map((line) => line.split('\t'));
    } catch {
      throw new Error(`Falta ${join(TATOEBA_DIR, name)}: descárgalo como indica vocab:translate.`);
    }
  };
  const sentences = new Map((await read('spa_sentences.tsv')).map(([id, , text]) => [Number(id), text ?? '']));
  const spanish = new Map<number, { id: number; text: string }>();
  for (const [japaneseId, spanishId] of await read('jpn-spa_links.tsv')) {
    const id = Number(spanishId);
    const text = sentences.get(id);
    const current = spanish.get(Number(japaneseId));
    if (text && (!current || id < current.id)) {
      spanish.set(Number(japaneseId), { id, text });
    }
  }
  return spanish;
}

/**
 * Reemplaza los lotes de solicitud. Las respuestas no se tocan: una vieja
 * que ya no calce con su solicitud la rechaza `merge`.
 */
export async function writeRequestBatches(requests: readonly TranslationRequest[], size: number): Promise<number> {
  await rm(REQUESTS_DIR, { recursive: true, force: true });
  await mkdir(REQUESTS_DIR, { recursive: true });
  await mkdir(RESPONSES_DIR, { recursive: true });
  let batches = 0;
  for (let start = 0; start < requests.length; start += size) {
    const name = `batch-${String(++batches).padStart(3, '0')}.json`;
    await writeFile(join(REQUESTS_DIR, name), JSON.stringify(requests.slice(start, start + size), null, 1), 'utf8');
  }
  return batches;
}

/** Todos los lotes de un directorio, como `[nombre, contenido]`. */
export async function readBatches(dir: string): Promise<[string, unknown][]> {
  let names: string[];
  try {
    names = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort();
  } catch {
    return [];
  }
  return Promise.all(
    names.map(async (name): Promise<[string, unknown]> => [name, JSON.parse(await readFile(join(dir, name), 'utf8'))]),
  );
}
