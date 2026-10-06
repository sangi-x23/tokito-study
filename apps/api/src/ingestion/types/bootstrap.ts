import type { GoogleDocsService } from '../../google-docs';
import type { LlmProvider } from '../../llm';
import type { PrismaService } from '../../prisma/prisma.service';

export interface BootstrapDeps {
  readonly docs: GoogleDocsService;
  readonly llm: LlmProvider;
  readonly prisma: PrismaService;
}
