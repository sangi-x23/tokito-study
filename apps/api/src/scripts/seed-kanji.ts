import { gunzipSync } from 'node:zlib';
import { SPANISH_MEANINGS } from '../kanji/helpers/kanji-meanings-es.js';
import { buildKanjiSeeds, planKanjiSeed, writeKanjiSeed } from '../kanji/helpers/kanji-seed.js';
import { KANJIDIC_URL, parseKanjidic } from '../kanji/helpers/kanjidic.js';
import { kanjiVgBundleUrl, parseKanjiVgBundle } from '../kanji/helpers/kanjivg-bundle.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { KANJIVG_TAG } from '../writing/helpers/kanjivg.js';

/**
 * Carga los kanji jōyō con sus datos de KANJIDIC2 y sus trazos de KanjiVG.
 * Es idempotente: crea lo que falta y actualiza solo lo que cambió.
 *
 *   pnpm --filter @tokito/api kanji:seed --dry-run   (descarga y compara, sin escribir)
 *   pnpm --filter @tokito/api kanji:seed
 */
async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');

  console.log('Descargando KANJIDIC2…');
  const entries = parseKanjidic(await downloadGzip(KANJIDIC_URL));
  console.log(`Descargando KanjiVG ${KANJIVG_TAG}…`);
  const strokes = parseKanjiVgBundle(
    await downloadGzip(kanjiVgBundleUrl()),
    entries.map((entry) => entry.character),
  );

  const { seeds, unusedTranslations } = buildKanjiSeeds(entries, strokes, SPANISH_MEANINGS);
  if (unusedTranslations.length > 0) {
    console.warn(`KANJIDIC2 ya trae en español (sobran en SPANISH_MEANINGS): ${unusedTranslations.join(' ')}`);
  }

  const prisma = new PrismaService();
  try {
    const stored = await prisma.kanji.findMany();
    const plan = planKanjiSeed(seeds, stored);
    console.log(
      `${seeds.length} kanji: ${plan.create.length} nuevos, ${plan.update.length} con cambios, ${plan.unchanged} sin cambios.`,
    );
    if (plan.orphaned.length > 0) {
      console.warn(`En la base pero ya no son jōyō (no se borran): ${plan.orphaned.join(' ')}`);
    }
    if (dryRun || (plan.create.length === 0 && plan.update.length === 0)) {
      return;
    }

    await prisma.$transaction((tx) => writeKanjiSeed(tx, plan), { timeout: 120_000 });
    console.log('Listo.');
  } finally {
    await prisma.$disconnect();
  }
}

async function downloadGzip(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} respondió ${response.status}`);
  }
  return gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
