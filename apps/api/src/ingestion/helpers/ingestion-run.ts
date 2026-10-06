import type { PrismaClient } from '../../generated/prisma/client';

// Una corrida legítima dura como mucho lo que una función de Vercel (300 s)
// o un import local. Una en RUNNING más vieja que esto murió sin cerrarse y
// no debe bloquear para siempre las siguientes.
const STALE_AFTER_MS = 30 * 60 * 1000;

export class IngestionLockedError extends Error {
  constructor() {
    super('Ya hay una corrida de ingesta en curso. Espera a que termine e inténtalo de nuevo.');
    this.name = 'IngestionLockedError';
  }
}

/** El índice único parcial `IngestionRun_one_running` rechaza un segundo RUNNING. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { code, message } = error as { code?: unknown; message?: unknown };
  return code === 'P2002' || (typeof message === 'string' && /23505|IngestionRun_one_running/.test(message));
}

/**
 * Ejecuta `task` con el candado de ingesta tomado y deja la corrida registrada.
 *
 * El candado es una fila en RUNNING; lo garantiza la base con un índice único
 * parcial, no el código, así que dos procesos a la vez no pueden tomarlo.
 * `task` devuelve cuántas pestañas procesó.
 */
export async function withIngestionRun<T extends { sectionsProcessed: number }>(
  prisma: PrismaClient,
  task: () => Promise<T>,
  now: () => Date = () => new Date(),
): Promise<T> {
  await prisma.ingestionRun.updateMany({
    where: { status: 'RUNNING', startedAt: { lt: new Date(now().getTime() - STALE_AFTER_MS) } },
    data: { status: 'FAILED', finishedAt: now(), error: 'Abandonada: siguió en RUNNING más de 30 minutos.' },
  });

  let runId: string;
  try {
    runId = (await prisma.ingestionRun.create({ data: { status: 'RUNNING' } })).id;
  } catch (error) {
    throw isUniqueViolation(error) ? new IngestionLockedError() : error;
  }

  try {
    const result = await task();
    await prisma.ingestionRun.update({
      where: { id: runId },
      data: { status: 'SUCCEEDED', finishedAt: now(), sectionsProcessed: result.sectionsProcessed },
    });
    return result;
  } catch (error) {
    await prisma.ingestionRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        finishedAt: now(),
        error: (error instanceof Error ? error.message : String(error)).slice(0, 2000),
      },
    });
    throw error;
  }
}
