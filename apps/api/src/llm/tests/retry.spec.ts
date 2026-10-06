import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '@google/genai';
import { classifyGeminiError, withRetry } from '../helpers/retry.js';
import { LlmQuotaExhaustedError } from '../llm.errors.js';
import { fakeClock } from './fake-clock.js';

/** Un error con el mismo formato que construye el SDK. */
function apiError(status: number, details: unknown[] = []): ApiError {
  return new ApiError({
    status,
    message: JSON.stringify({ error: { code: status, message: 'algo', status: 'X', details } }),
  });
}

const RETRY_INFO = (delay: string) => ({
  '@type': 'type.googleapis.com/google.rpc.RetryInfo',
  retryDelay: delay,
});

const QUOTA = (quotaId: string) => ({
  '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
  violations: [{ quotaId }],
});

describe('classifyGeminiError', () => {
  it('un 429 por minuto es reintentable y trae la espera sugerida', () => {
    const error = apiError(429, [QUOTA('GenerateRequestsPerMinutePerProjectPerModel-FreeTier'), RETRY_INFO('12.5s')]);
    assert.deepEqual(classifyGeminiError(error), { kind: 'retryable', retryAfterMs: 12500 });
  });

  it('un 429 por la cuota diaria no se reintenta', () => {
    const error = apiError(429, [QUOTA('GenerateRequestsPerDayPerProjectPerModel-FreeTier')]);
    assert.deepEqual(classifyGeminiError(error), {
      kind: 'daily-quota',
      quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
    });
  });

  it('un 503 sin detalles es reintentable sin espera sugerida', () => {
    assert.deepEqual(classifyGeminiError(apiError(503)), { kind: 'retryable', retryAfterMs: null });
  });

  it('un 400 es fatal', () => {
    assert.deepEqual(classifyGeminiError(apiError(400)), { kind: 'fatal' });
  });

  it('un fallo de red es reintentable', () => {
    assert.deepEqual(classifyGeminiError(new TypeError('fetch failed')), {
      kind: 'retryable',
      retryAfterMs: null,
    });
  });

  it('el timeout de la petición es reintentable', () => {
    const error = new DOMException('This operation was aborted', 'AbortError');
    assert.deepEqual(classifyGeminiError(error), { kind: 'retryable', retryAfterMs: null });
  });

  it('tolera un mensaje que no es JSON', () => {
    const error = new ApiError({ status: 503, message: 'Service Unavailable' });
    assert.deepEqual(classifyGeminiError(error), { kind: 'retryable', retryAfterMs: null });
  });
});

describe('withRetry', () => {
  const failingTimes = (times: number, error: unknown) => {
    let calls = 0;
    return {
      task: async () => {
        calls += 1;
        if (calls <= times) {
          throw error;
        }
        return 'ok';
      },
      calls: () => calls,
    };
  };

  it('reintenta con backoff exponencial hasta que sale bien', async () => {
    const { clock, sleeps } = fakeClock();
    const { task, calls } = failingTimes(3, apiError(503));

    const result = await withRetry(task, { maxRetries: 4, baseDelayMs: 1000, clock, random: () => 1 });

    assert.equal(result, 'ok');
    assert.equal(calls(), 4);
    assert.deepEqual(sleeps, [1000, 2000, 4000]);
  });

  it('aplica jitter de entre el 50 % y el 100 %', async () => {
    const { clock, sleeps } = fakeClock();
    const { task } = failingTimes(1, apiError(503));

    await withRetry(task, { maxRetries: 1, baseDelayMs: 1000, clock, random: () => 0 });

    assert.deepEqual(sleeps, [500]);
  });

  it('respeta la espera sugerida por la API si es mayor que el backoff', async () => {
    const { clock, sleeps } = fakeClock();
    const { task } = failingTimes(1, apiError(429, [RETRY_INFO('30s')]));

    await withRetry(task, { maxRetries: 1, baseDelayMs: 1000, clock, random: () => 1 });

    assert.deepEqual(sleeps, [30000]);
  });

  it('se rinde tras maxRetries y lanza el último error', async () => {
    const { clock } = fakeClock();
    const error = apiError(503);
    const { task, calls } = failingTimes(10, error);

    await assert.rejects(withRetry(task, { maxRetries: 2, clock }), (thrown) => thrown === error);
    assert.equal(calls(), 3);
  });

  it('no reintenta un error fatal', async () => {
    const { clock, sleeps } = fakeClock();
    const { task, calls } = failingTimes(1, apiError(400));

    await assert.rejects(withRetry(task, { maxRetries: 3, clock }));
    assert.equal(calls(), 1);
    assert.deepEqual(sleeps, []);
  });

  it('convierte la cuota diaria en LlmQuotaExhaustedError sin reintentar', async () => {
    const { clock, sleeps } = fakeClock();
    const { task } = failingTimes(1, apiError(429, [QUOTA('GenerateRequestsPerDay-FreeTier')]));

    await assert.rejects(withRetry(task, { maxRetries: 3, clock }), LlmQuotaExhaustedError);
    assert.deepEqual(sleeps, []);
  });
});
