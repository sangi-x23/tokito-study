import { z } from 'zod';
import type { LabelWithExamples, Taxonomy } from '../types/llm-provider';
import { checkTopicTree, proposedTopicSchema } from './common';

export const taxonomySchema = z.object({
  topics: z.array(proposedTopicSchema),
  labelMap: z.array(z.object({ label: z.string(), topicSlug: z.string() })),
});

/**
 * El árbol es válido y cada etiqueta de entrada aparece exactamente una vez,
 * apuntando a un tema que existe. Una etiqueta sin tema dejaría ítems sin
 * clasificar, y todo ítem tiene que tener al menos un tema.
 */
export function checkTaxonomy(result: Taxonomy, labels: readonly LabelWithExamples[]): string[] {
  const issues = checkTopicTree(result.topics);
  const slugs = new Set(result.topics.map((topic) => topic.slug));
  const expected = new Set(labels.map((entry) => entry.label));
  const seen = new Set<string>();

  for (const { label, topicSlug } of result.labelMap) {
    if (!expected.has(label)) {
      issues.push(`labelMap: "${label}" no es ninguna de las etiquetas enviadas`);
    }
    if (seen.has(label)) {
      issues.push(`labelMap: "${label}" aparece más de una vez`);
    }
    if (!slugs.has(topicSlug)) {
      issues.push(`labelMap: "${label}" apunta a "${topicSlug}", que no está en topics`);
    }
    seen.add(label);
  }

  for (const label of expected) {
    if (!seen.has(label)) {
      issues.push(`labelMap: falta la etiqueta "${label}"`);
    }
  }

  return issues;
}
