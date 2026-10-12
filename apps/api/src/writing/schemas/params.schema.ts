import type { KanaScript } from '@tokito/shared';
import { z } from 'zod';

// En la URL va en minúsculas (`/kana/hiragana`); en la base, como el enum.
export const scriptSchema = z
  .enum(['hiragana', 'katakana'])
  .transform((script): KanaScript => (script === 'hiragana' ? 'HIRAGANA' : 'KATAKANA'));
