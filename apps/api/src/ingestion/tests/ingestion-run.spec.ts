import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { IngestionLockedError, withIngestionRun } from '../helpers/ingestion-run.js';

interface Call {
  readonly method: string;
  readonly args: unknown;
}

/** Lo mínimo de Prisma que usa el candado. */
function fakePrisma(options: { createFails?: unknown } = {}) {
  const calls: Call[] = [];
  const prisma = {
    ingestionRun: {
      updateMany: async (args: unknown) => {
        calls.push({ method: 'updateMany', args });
        return { count: 0 };
      },
      create: async (args: unknown) => {
        calls.push({ method: 'create', args });
        if (options.createFails) {
          throw options.createFails;
        }
        return { id: 'run-1' };
      },
      update: async (args: unknown) => {
        calls.push({ method: 'update', args });
        return {};
      },
    },
  };

  return { prisma: prisma as unknown as PrismaClient, calls };
}

const statusOf = (calls: Call[]) =>
  (calls.find((call) => call.method === 'update')?.args as { data: { status: string } }).data.status;

describe('withIngestionRun', () => {
  it('cierra la corrida como SUCCEEDED con las pestañas procesadas', async () => {
    const { prisma, calls } = fakePrisma();

    await withIngestionRun(prisma, async () => ({ sectionsProcessed: 3 }));

    const update = calls.find((call) => call.method === 'update')?.args as { data: Record<string, unknown> };
    assert.equal(update.data.status, 'SUCCEEDED');
    assert.equal(update.data.sectionsProcessed, 3);
  });

  it('cierra la corrida como FAILED con el mensaje y relanza el error', async () => {
    const { prisma, calls } = fakePrisma();

    await assert.rejects(
      withIngestionRun(prisma, async () => Promise.reject(new Error('se rompió'))),
      /se rompió/,
    );

    assert.equal(statusOf(calls), 'FAILED');
  });

  it('convierte la violación del índice único en IngestionLockedError', async () => {
    const { prisma } = fakePrisma({ createFails: { code: 'P2002', message: 'Unique constraint failed' } });

    await assert.rejects(withIngestionRun(prisma, async () => ({ sectionsProcessed: 0 })), IngestionLockedError);
  });

  it('libera antes una corrida abandonada en RUNNING hace más de 30 minutos', async () => {
    const { prisma, calls } = fakePrisma();
    const now = new Date(Date.UTC(2026, 9, 1, 12, 0));

    await withIngestionRun(prisma, async () => ({ sectionsProcessed: 0 }), () => now);

    const release = calls[0]?.args as { where: { startedAt: { lt: Date } } };
    assert.equal(calls[0]?.method, 'updateMany');
    assert.deepEqual(release.where.startedAt.lt, new Date(Date.UTC(2026, 9, 1, 11, 30)));
  });
});
