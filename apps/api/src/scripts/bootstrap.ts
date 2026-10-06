import { GoogleDocsService } from '../google-docs/index.js';
import { extractPhase, importPhase, taxonomyPhase } from '../ingestion/bootstrap/bootstrap.js';
import { ManualProvider } from '../ingestion/bootstrap/manual-provider.js';
import { GeminiProvider, type LlmProvider } from '../llm/index.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Lectura inicial del documento, en tres fases que se corren por separado:
 *
 *   pnpm --filter @tokito/api ingest:bootstrap extract [--force] [--manual]
 *   pnpm --filter @tokito/api ingest:bootstrap taxonomy [--force] [--manual]
 *   (revisar a mano apps/api/.bootstrap/taxonomy.json)
 *   pnpm --filter @tokito/api ingest:bootstrap import [--dry-run]
 *
 * Corre en local contra Neon, sin el límite de 300 s de Vercel.
 *
 * Con `--manual` no se llama a Gemini: cada llamada deja una solicitud en
 * `.bootstrap/manual/` y se responde a mano (ver `ManualProvider`).
 */
const USAGE = 'Uso: ingest:bootstrap <extract|taxonomy|import> [--force] [--dry-run] [--manual]';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const phase = args.find((arg) => !arg.startsWith('-'));
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const llm: LlmProvider = args.includes('--manual') ? new ManualProvider() : new GeminiProvider();

  const prisma = new PrismaService();

  try {
    switch (phase) {
      case 'extract':
        await extractPhase({ docs: new GoogleDocsService(), llm, prisma }, { force });
        break;
      case 'taxonomy':
        await taxonomyPhase({ llm }, { force });
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
