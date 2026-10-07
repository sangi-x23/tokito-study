import type { GoogleDocsService } from '../../google-docs/index.js';
import type { LlmProvider } from '../../llm/index.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

export interface BootstrapDeps {
  readonly docs: GoogleDocsService;
  readonly llm: LlmProvider;
  readonly prisma: PrismaService;
}
