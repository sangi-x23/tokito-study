import { z } from 'zod';

/** Los ejemplos de una palabra, que la base guarda como Json. */
export const examplesSchema = z.array(
  z.object({
    japanese: z.string(),
    spanish: z.string(),
    tatoebaId: z.number().int(),
    spanishTatoebaId: z.number().int().nullable(),
  }),
);
