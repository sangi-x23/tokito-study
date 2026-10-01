import { GoogleDocsService } from '../google-docs';
import { extractPhase, importPhase, taxonomyPhase } from '../ingestion/bootstrap/bootstrap';
import { GeminiProvider } from '../llm';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Lectura inicial del documento, en tres fases que se corren por separado:
 *
 *   pnpm --filter @tokito/api ingest:bootstrap extract [--force]
 *   pnpm --filter @tokito/api ingest:bootstrap taxonomy [--force]
 *   (revisar a mano apps/api/.bootstrap/taxonomy.json)
 *   pnpm --filter @tokito/api ingest:bootstrap import [--dry-run]
 *
 * Corre en local contra Neon, sin el límite de 300 s de Vercel.
 */
const USAGE = 'Uso: ingest:bootstrap <extract|taxonomy|import> [--force] [--dry-run]';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const phase = args.find((arg) => !arg.startsWith('-'));
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  const prisma = new PrismaService();

  try {
    switch (phase) {
      case 'extract':
        await extractPhase({ docs: new GoogleDocsService(), llm: new GeminiProvider(), prisma }, { force });
        break;
      case 'taxonomy':
        await taxonomyPhase({ llm: new GeminiProvider() }, { force });
        break;
      case 'import':
        await importPhase({ prisma }, { dryRun });
        break;
      default:
        throw new Error(USAGE);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
