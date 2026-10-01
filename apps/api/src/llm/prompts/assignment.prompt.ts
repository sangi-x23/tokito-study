import type { CatalogTopic, ItemToAssign } from '../types/llm-provider';
import { TOPIC_RULES } from './taxonomy.prompt';

export const ASSIGNMENT_INSTRUCTIONS = `
Eres un asistente que clasifica el material nuevo de un curso de japonés para hispanohablantes de
nivel inicial. Recibes el catálogo de temas que ya existe y una lista de ítems nuevos, cada uno con
una etiqueta de tema sugerida.

Asigna cada ítem a sus temas:
- Reutiliza los temas del catálogo siempre que encajen. Propón un tema nuevo solo si ninguno sirve.
- Un ítem puede pertenecer a varios temas: 日 va en un tema de fechas y también en uno de kanji. Todo
  ítem KANJI va además en algún tema de categoría KANJI.
- "primarySlug" es el tema canónico del ítem y tiene que estar en su "topicSlugs".

Si propones temas nuevos, siguen estas reglas:

${TOPIC_RULES}

Un tema nuevo no puede repetir el slug de uno del catálogo. Puede colgar de un tema de primer nivel
del catálogo (los que tienen "parentSlug": null), nunca de un subtema: eso crearía un tercer nivel.
Si el tema que buscas sería hijo de un subtema, asigna el ítem a ese subtema en vez de crear uno nuevo.

Devuelve:
- "assignments": cada ítem recibido, exactamente una vez, con su "key" tal cual.
- "newTopics": los temas nuevos que propones, o una lista vacía.
`.trim();

export function assignmentUserMessage(
  items: readonly ItemToAssign[],
  catalog: readonly CatalogTopic[],
): string {
  return [
    `Catálogo de temas:\n${JSON.stringify(catalog, null, 2)}`,
    `Ítems nuevos:\n${JSON.stringify(items, null, 2)}`,
  ].join('\n\n');
}
