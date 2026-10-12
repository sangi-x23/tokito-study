import { PrismaService } from '../prisma/prisma.service.js';
import { planKanaSeed, withStrokes, writeKanaSeed } from '../writing/helpers/kana-seed.js';
import { kanaTable, singleCharacters } from '../writing/helpers/kana-table.js';
import { KANJIVG_TAG, kanjiVgUrl, parseStrokes } from '../writing/helpers/kanjivg.js';

const CONCURRENCY = 8;

/**
 * Carga los kana con sus trazos de KanjiVG. Es idempotente: crea lo que falta
 * y actualiza solo lo que cambió.
 *
 *   pnpm --filter @tokito/api kana:seed --dry-run   (descarga y compara, sin escribir)
 *   pnpm --filter @tokito/api kana:seed
 */
async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const table = kanaTable();

  const characters = singleCharacters(table);
  console.log(`Descargando ${characters.length} SVG de KanjiVG ${KANJIVG_TAG}…`);
  const seeds = withStrokes(table, await downloadStrokes(characters));

  const prisma = new PrismaService();
  try {
    const stored = await prisma.kana.findMany();
    const plan = planKanaSeed(seeds, stored);
    console.log(
      `${seeds.length} kana: ${plan.create.length} nuevos, ${plan.update.length} con cambios, ${plan.unchanged} sin cambios.`,
    );
    if (plan.orphaned.length > 0) {
      console.warn(`En la base pero no en la tabla (no se borran): ${plan.orphaned.join(' ')}`);
    }
    if (dryRun || (plan.create.length === 0 && plan.update.length === 0)) {
      return;
    }

    await prisma.$transaction((tx) => writeKanaSeed(tx, plan), { timeout: 60_000 });
    console.log('Listo.');
  } finally {
    await prisma.$disconnect();
  }
}

async function downloadStrokes(characters: readonly string[]): Promise<Map<string, string[]>> {
  const strokes = new Map<string, string[]>();
  const queue = [...characters];

  const worker = async (): Promise<void> => {
    for (let character = queue.shift(); character; character = queue.shift()) {
      const url = kanjiVgUrl(character);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KanjiVG respondió ${response.status} para ${character} (${url})`);
      }
      try {
        strokes.set(character, parseStrokes(await response.text()));
      } catch (error) {
        throw new Error(`SVG inválido para ${character}: ${error instanceof Error ? error.message : error}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return strokes;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
