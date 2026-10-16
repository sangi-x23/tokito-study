import type { JlptLevel } from '@tokito/shared';
import { z } from 'zod';

/** De N5 a N1, sin la N: `5` es N5. */
export const levelSchema = z.enum(['1', '2', '3', '4', '5']).transform((level): JlptLevel => Number(level) as JlptLevel);
