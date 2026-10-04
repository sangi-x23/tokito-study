import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

/** kebab-case ASCII, igual que los slugs que produce la taxonomía. */
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);

/** Los IDs son cuid: minúsculas y dígitos. */
export const idSchema = z.string().regex(/^[a-z0-9]{20,40}$/);

/** Valida un parámetro de la URL y responde 400 si no tiene la forma esperada. */
export function parseParam<Schema extends z.ZodType>(schema: Schema, value: unknown, name: string): z.infer<Schema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException(`El parámetro "${name}" no es válido`);
  }
  return result.data;
}
