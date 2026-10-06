import { z } from 'zod';
import { ItemType } from '../../generated/prisma/enums';
import type { Extraction } from '../types/llm-provider';
import { nonEmptyText } from './common';

const kanjiSchema = z.object({
  onyomi: z.array(z.string()),
  kunyomi: z.array(z.string()),
  strokeCount: z.int().min(1).max(40).nullable(),
  jlptLevel: z.int().min(1).max(5).nullable(),
});

const itemSchema = z.object({
  type: z.enum(ItemType),
  japanese: nonEmptyText(),
  reading: z.string().nullable(),
  meaning: nonEmptyText(),
  example: z.string().nullable(),
  topicLabel: nonEmptyText(),
  kanji: kanjiSchema.nullable(),
});

export const extractionSchema = z.object({
  items: z.array(itemSchema),
  imageTexts: z.array(z.object({ imageId: z.string(), text: z.string() })),
});

const SINGLE_KANJI = /^\p{Script=Han}$/u;

/**
 * Reglas que dependen de la entrada o que el JSON Schema no expresa:
 * `KanjiDetail` solo cuelga de ítems `KANJI` (invariante del modelo de datos),
 * un ítem `KANJI` es un único carácter, y cada imagen enviada tiene
 * exactamente un texto extraído.
 */
export function checkExtraction(result: Extraction, imageIds: readonly string[]): string[] {
  const issues: string[] = [];

  result.items.forEach((item, index) => {
    const where = `items[${index}] (${item.japanese})`;

    if (item.type === 'KANJI' && item.kanji === null) {
      issues.push(`${where}: es KANJI pero no trae lecturas`);
    }
    if (item.type !== 'KANJI' && item.kanji !== null) {
      issues.push(`${where}: trae datos de kanji pero es ${item.type}`);
    }
    if (item.type === 'KANJI' && !SINGLE_KANJI.test(item.japanese)) {
      issues.push(`${where}: un ítem KANJI debe ser un solo kanji`);
    }
  });

  const expected = new Set(imageIds);
  const counts = new Map<string, number>();

  for (const { imageId } of result.imageTexts) {
    if (!expected.has(imageId)) {
      issues.push(`imageTexts: "${imageId}" no es ninguna de las imágenes enviadas`);
    }
    counts.set(imageId, (counts.get(imageId) ?? 0) + 1);
  }

  for (const imageId of expected) {
    const count = counts.get(imageId) ?? 0;
    if (count !== 1) {
      issues.push(`imageTexts: la imagen "${imageId}" aparece ${count} veces; debe aparecer una`);
    }
  }

  return issues;
}
