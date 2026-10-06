/** El tiempo, inyectable para probar esperas sin esperar de verdad. */
export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export type ErrorKind =
  | { readonly kind: 'retryable'; readonly retryAfterMs: number | null }
  | { readonly kind: 'daily-quota'; readonly quotaId: string }
  | { readonly kind: 'fatal' };

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
