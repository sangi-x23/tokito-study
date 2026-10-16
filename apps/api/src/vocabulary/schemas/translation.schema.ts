import { z } from 'zod';

const text = z.string().trim().min(1);

/** Lo que devuelve quien traduce un lote: solo el español. */
export const translationResponseSchema = z.array(
  z.object({
    key: text,
    equivalents: z.array(text.max(60)).min(1).max(6),
    meaning: text.min(10).max(700),
    examples: z.array(z.object({ tatoebaId: z.number().int().positive(), spanish: text })).max(2),
  }),
);

/**
 * Una entrada de `apps/api/data/vocabulary/n<nivel>.json`. `source` es la
 * huella del inglés del que salió: si JMdict lo cambia, hay que retraducir.
 */
export const translationSchema = z.object({
  key: text,
  source: z.string().regex(/^[0-9a-f]{16}$/u),
  equivalents: z.array(text.max(60)).min(1).max(6),
  meaning: text.min(10).max(700),
  examples: z
    .array(
      z.object({
        tatoebaId: z.number().int().positive(),
        spanish: text,
        spanishTatoebaId: z.number().int().positive().nullable(),
      }),
    )
    .max(2),
});

export const translationFileSchema = z.array(translationSchema);

export type TranslationResponse = z.infer<typeof translationResponseSchema>[number];
export type Translation = z.infer<typeof translationSchema>;
