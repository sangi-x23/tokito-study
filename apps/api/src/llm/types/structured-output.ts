/** Lo mínimo que se necesita de la respuesta del modelo. */
export interface ModelOutput {
  readonly text: string | undefined;
  readonly finishReason: string | undefined;
}
