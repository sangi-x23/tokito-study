import { z } from 'zod';
import { TopicCategory } from '../../generated/prisma/enums.js';

/**
 * Texto no vacío. Va como `refine` y no como `.min(1)` para que no llegue al
 * JSON Schema: lo que se le pasa a Gemini se mantiene en el subconjunto que
 * soporta con seguridad, y la regla se comprueba igual al validar.
 */
export const nonEmptyText = (): z.ZodString =>
  z.string().refine((value) => value.trim().length > 0, { message: 'no puede estar vacío' });

export const proposedTopicSchema = z.object({
  slug: z.string(),
  name: nonEmptyText(),
  description: z.string().nullable(),
  category: z.enum(TopicCategory),
  parentSlug: z.string().nullable(),
});

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// La navegación es tema → subtema; un tercer nivel complicaría la app sin
// aportar nada a la escala de un curso.
const MAX_DEPTH = 2;

interface TopicNode {
  readonly slug: string;
  readonly parentSlug: string | null;
}

/**
 * Comprueba que un conjunto de temas forma un árbol válido: slugs en
 * kebab-case y únicos, padres que existen, sin ciclos y como mucho dos niveles.
 *
 * `topics` incluye el catálogo existente cuando se valida una asignación, para
 * que un tema nuevo pueda colgar de uno que ya está en la base.
 */
export function checkTopicTree(topics: readonly TopicNode[]): string[] {
  const issues: string[] = [];
  const bySlug = new Map<string, TopicNode>();

  for (const topic of topics) {
    if (!SLUG.test(topic.slug)) {
      issues.push(`slug "${topic.slug}" no está en kebab-case ASCII`);
    }
    if (bySlug.has(topic.slug)) {
      issues.push(`slug "${topic.slug}" repetido`);
    }
    bySlug.set(topic.slug, topic);
  }

  for (const topic of topics) {
    if (topic.parentSlug !== null && !bySlug.has(topic.parentSlug)) {
      issues.push(`el tema "${topic.slug}" cuelga de "${topic.parentSlug}", que no existe`);
      continue;
    }

    // Subir por los padres detecta a la vez ciclos y profundidad excesiva.
    const seen = new Set<string>([topic.slug]);
    let depth = 1;
    let parent = topic.parentSlug;

    while (parent !== null) {
      if (seen.has(parent)) {
        issues.push(`ciclo en la jerarquía que pasa por "${topic.slug}"`);
        break;
      }
      seen.add(parent);
      depth += 1;
      parent = bySlug.get(parent)?.parentSlug ?? null;
    }

    if (depth > MAX_DEPTH) {
      issues.push(`el tema "${topic.slug}" está a ${depth} niveles; el máximo es ${MAX_DEPTH}`);
    }
  }

  return issues;
}
