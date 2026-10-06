import type { GenerateContentParameters } from '@google/genai';
import type { Clock } from './retry';

/** Lo que el proveedor usa de la respuesta del SDK; los tests lo imitan. */
export interface GeminiResponse {
  readonly text?: string | undefined;
  readonly candidates?: readonly { readonly finishReason?: string | undefined }[] | undefined;
  readonly usageMetadata?: { readonly totalTokenCount?: number | undefined } | undefined;
}

export type GenerateFn = (params: GenerateContentParameters) => Promise<GeminiResponse>;

export interface GeminiSettings {
  readonly model: string;
  readonly minIntervalMs: number;
  readonly maxRetries: number;
}

export interface GeminiDeps {
  readonly generate?: GenerateFn;
  readonly settings?: GeminiSettings;
  readonly clock?: Clock;
  readonly random?: () => number;
}
