import { z } from 'zod';
import type { CatalogTopic, ItemToAssign, TopicAssignment } from '../types/llm-provider';
import { checkTopicTree, proposedTopicSchema } from './common';

export const assignmentSchema = z.object({
  assignments: z.array(
    z.object({
      key: z.string(),
      topicSlugs: z.array(z.string()),
      primarySlug: z.string(),
    }),
  ),
  newTopics: z.array(proposedTopicSchema),
});

/**
 * Cada ítem recibe una sola asignación con al menos un tema, el tema primario
 * está entre sus temas, y todo slug existe en el catálogo o entre los nuevos.
 * Un tema nuevo no puede pisar el slug de uno del catálogo: la ingesta hace
 * upsert por slug y acabaría sobrescribiéndolo.
 */
export function checkAssignment(
  result: TopicAssignment,
  items: readonly ItemToAssign[],
  catalog: readonly CatalogTopic[],
): string[] {
  const catalogSlugs = new Set(catalog.map((topic) => topic.slug));
  const issues = result.newTopics
    .filter((topic) => catalogSlugs.has(topic.slug))
    .map((topic) => `newTopics: "${topic.slug}" ya existe en el catálogo`);

  // El árbol se valida junto con el catálogo para que un tema nuevo pueda
  // colgar de uno existente.
  issues.push(
    ...checkTopicTree([
      ...catalog,
      ...result.newTopics.filter((topic) => !catalogSlugs.has(topic.slug)),
    ]),
  );

  const known = new Set([...catalogSlugs, ...result.newTopics.map((topic) => topic.slug)]);
  const expected = new Set(items.map((item) => item.key));
  const seen = new Set<string>();

  for (const { key, topicSlugs, primarySlug } of result.assignments) {
    if (!expected.has(key)) {
      issues.push(`assignments: "${key}" no es ninguno de los ítems enviados`);
    }
    if (seen.has(key)) {
      issues.push(`assignments: "${key}" aparece más de una vez`);
    }
    seen.add(key);

    if (topicSlugs.length === 0) {
      issues.push(`assignments: "${key}" no tiene ningún tema`);
    }
    if (!topicSlugs.includes(primarySlug)) {
      issues.push(`assignments: el tema primario de "${key}" no está entre sus temas`);
    }
    for (const slug of topicSlugs) {
      if (!known.has(slug)) {
        issues.push(`assignments: "${key}" apunta a "${slug}", que no existe`);
      }
    }
  }

  for (const key of expected) {
    if (!seen.has(key)) {
      issues.push(`assignments: falta el ítem "${key}"`);
    }
  }

  return issues;
}
