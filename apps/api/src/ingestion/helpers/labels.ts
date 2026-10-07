import type { LabelWithExamples } from '../../llm/index.js';
import type { SectionExtraction } from '../types/import-plan.js';

const EXAMPLES_PER_LABEL = 5;

/**
 * Las etiquetas de tema de todas las extracciones, cada una con unos pocos
 * ítems de ejemplo, en el orden en que aparecen en el curso. Es la entrada de
 * `buildTaxonomy`: con los ejemplos el modelo entiende qué agrupa cada
 * etiqueta sin recibir el material completo.
 */
export function collectLabels(extractions: readonly SectionExtraction[]): LabelWithExamples[] {
  const byLabel = new Map<string, string[]>();

  for (const extraction of [...extractions].sort((a, b) => a.position - b.position)) {
    for (const item of extraction.items) {
      const examples = byLabel.get(item.topicLabel) ?? [];
      const example = `${item.japanese} (${item.meaning})`;

      if (examples.length < EXAMPLES_PER_LABEL && !examples.includes(example)) {
        examples.push(example);
      }
      byLabel.set(item.topicLabel, examples);
    }
  }

  return [...byLabel].map(([label, examples]) => ({ label, examples }));
}
