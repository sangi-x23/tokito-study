import { ApiError } from '@google/genai';
import { LlmQuotaExhaustedError } from '../llm.errors';
import { systemClock, type Clock } from './clock';

export type ErrorKind =
  | { readonly kind: 'retryable'; readonly retryAfterMs: number | null }
  | { readonly kind: 'daily-quota'; readonly quotaId: string }
  | { readonly kind: 'fatal' };

// Errores transitorios: cuota por minuto, sobrecarga del servidor, timeouts.
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

interface GoogleErrorDetail {
  readonly '@type'?: string;
  readonly retryDelay?: string;
  readonly violations?: readonly { readonly quotaId?: string }[];
}

/** El SDK mete el cuerpo JSON del error en `message`. */
function errorDetails(error: ApiError): readonly GoogleErrorDetail[] {
  try {
    const body = JSON.parse(error.message) as { error?: { details?: GoogleErrorDetail[] } };
    return body.error?.details ?? [];
  } catch {
    return [];
  }
}

/** `"12s"` o `"1.5s"`, el formato de `google.protobuf.Duration` en JSON. */
function parseDuration(value: string | undefined): number | null {
  const match = value ? /^(\d+(?:\.\d+)?)s$/.exec(value) : null;
  return match?.[1] ? Math.ceil(Number(match[1]) * 1000) : null;
}

/**
 * Decide qué hacer con un error de Gemini.
 *
 * Un 429 puede ser de dos cuotas: la de por minuto se recupera esperando, la
 * diaria no hasta medianoche (hora del Pacífico). La diferencia está en el
 * `quotaId` del detalle `QuotaFailure`.
 */
export function classifyGeminiError(error: unknown): ErrorKind {
  if (!(error instanceof ApiError)) {
    // Fallo de red antes de recibir respuesta: `fetch` lanza TypeError. El
    // timeout de `httpOptions` aborta la petición y lanza un `AbortError`.
    const transient = error instanceof TypeError || (error instanceof Error && error.name === 'AbortError');
    return transient ? { kind: 'retryable', retryAfterMs: null } : { kind: 'fatal' };
  }

  if (!RETRYABLE_STATUS.has(error.status)) {
    return { kind: 'fatal' };
  }

  const details = errorDetails(error);

  if (error.status === 429) {
    const daily = details
      .flatMap((detail) => detail.violations ?? [])
      .find((violation) => /PerDay/i.test(violation.quotaId ?? ''));

    if (daily?.quotaId) {
      return { kind: 'daily-quota', quotaId: daily.quotaId };
    }
  }

  const retryInfo = details.find((detail) => detail['@type']?.endsWith('RetryInfo'));
  return { kind: 'retryable', retryAfterMs: parseDuration(retryInfo?.retryDelay) };
}

export interface RetryOptions {
  readonly maxRetries: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly clock?: Clock;
  /** Inyectable para que el jitter sea determinista en los tests. */
  readonly random?: () => number;
  readonly classify?: (error: unknown) => ErrorKind;
  readonly onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
}

/**
 * Reintenta con backoff exponencial y jitter. Si la API dice cuánto esperar
 * (`RetryInfo`), se respeta, aunque sea más que el backoff calculado.
 */
export async function withRetry<T>(task: () => Promise<T>, options: RetryOptions): Promise<T> {
  const {
    maxRetries,
    baseDelayMs = 2000,
    maxDelayMs = 60_000,
    clock = systemClock,
    random = Math.random,
    classify = classifyGeminiError,
    onRetry,
  } = options;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      const kind = classify(error);

      if (kind.kind === 'daily-quota') {
        throw new LlmQuotaExhaustedError(kind.quotaId);
      }
      if (kind.kind === 'fatal' || attempt >= maxRetries) {
        throw error;
      }

      // Jitter entre el 50 % y el 100 % del backoff, para no sincronizar
      // reintentos si algún día corren dos procesos.
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt) * (0.5 + random() * 0.5);
      const delayMs = Math.ceil(Math.max(backoff, kind.retryAfterMs ?? 0));

      onRetry?.(attempt + 1, delayMs, error);
      await clock.sleep(delayMs);
    }
  }
}
