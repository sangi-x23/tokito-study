import { GoogleDocsService } from '../google-docs';
import { IngestionService } from '../ingestion/ingestion.service';
import { GeminiProvider } from '../llm';
import { PrismaService } from '../prisma/prisma.service';

/**
 * La misma ingesta que dispara el cron, corrida en local:
 *
 *   pnpm --filter @tokito/api ingest:run --check   (lista las pestañas cambiadas, sin LLM ni escrituras)
 *   pnpm --filter @tokito/api ingest:run           (procesa todas, sin el presupuesto de tiempo de Vercel)
 */
async function main(): Promise<void> {
  const check = process.argv.slice(2).includes('--check');
  const prisma = new PrismaService();
  const ingestion = new IngestionService(new GoogleDocsService(), new GeminiProvider(), prisma);

  try {
    if (check) {
      const { changed, unchanged } = await ingestion.findChanges();
      console.log(`${unchanged} pestañas sin cambios, ${changed.length} nuevas o modificadas:`);
      changed.forEach((prepared) => console.log(`  [${prepared.section.position}] ${prepared.section.title}`));
      return;
    }

    const summary = await ingestion.run({ timeBudgetMs: Infinity });
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
