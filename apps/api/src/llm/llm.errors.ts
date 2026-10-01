/**
 * La respuesta del LLM no cumple el contrato: JSON roto, campos que faltan o
 * reglas del dominio incumplidas. No se reintenta: la corrida de ingesta se
 * marca `FAILED` y no se escribe nada.
 */
export class LlmValidationError extends Error {
  constructor(
    readonly operation: string,
    readonly issues: readonly string[],
  ) {
    super(`Respuesta inválida del LLM en ${operation}:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'LlmValidationError';
  }
}

/**
 * Se agotó la cuota diaria del proyecto. Reintentar no sirve hasta que se
 * reinicie (medianoche, hora del Pacífico), así que se falla de inmediato.
 */
export class LlmQuotaExhaustedError extends Error {
  constructor(readonly quotaId: string) {
    super(
      `Se agotó la cuota diaria de Gemini (${quotaId}). Se reinicia a medianoche, hora del Pacífico.`,
    );
    this.name = 'LlmQuotaExhaustedError';
  }
}
