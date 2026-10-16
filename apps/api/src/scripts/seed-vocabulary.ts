import { PrismaService } from '../prisma/prisma.service.js';
import { downloadVocabularySources, readTranslations } from '../vocabulary/helpers/vocabulary-files.js';
import { buildVocabularySeeds, planVocabularySeed, writeVocabularySeed } from '../vocabulary/helpers/vocabulary-seed.js';

/**
 * Carga el vocabulario de N5 a N1: las listas de Waller, JMdict y las
 * traducciones de `apps/api/data/vocabulary/`. Es idempotente: crea lo que
 * falta y actualiza solo lo que cambió.
 *
 *   pnpm --filter @tokito/api vocab:seed --dry-run   (descarga y compara, sin escribir)
 *   pnpm --filter @tokito/api vocab:seed
 */
async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');

  const seeds = buildVocabularySeeds(await downloadVocabularySources(), await readTranslations());

  const prisma = new PrismaService();
  try {
    const stored = await prisma.vocabulary.findMany();
    const plan = planVocabularySeed(seeds, stored);
    console.log(
      `${seeds.length} palabras: ${plan.create.length} nuevas, ${plan.update.length} con cambios, ${plan.unchanged} sin cambios.`,
    );
    if (plan.orphaned.length > 0) {
      console.warn(`En la base pero ya no están en las listas (no se borran): ${plan.orphaned.join(' ')}`);
    }
    if (dryRun || (plan.create.length === 0 && plan.update.length === 0)) {
      return;
    }

    await prisma.$transaction((tx) => writeVocabularySeed(tx, plan), { timeout: 300_000 });
    console.log('Listo.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
