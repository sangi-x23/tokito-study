import type { LabelWithExamples } from '../types/llm-provider';

// Compartidas con la asignación, que también puede proponer temas nuevos.
export const TOPIC_RULES = `
Cada tema tiene:
- "slug": identificador en kebab-case ASCII, sin tildes ni ñ ("fechas-y-calendario", "dias-de-la-semana").
- "name": nombre en español para mostrar ("Fechas y calendario").
- "description": una frase breve, o null.
- "category": GRAMMAR, VOCABULARY, KANJI, EXPRESSION (saludos y frases hechas) u OTHER.
- "parentSlug": el slug del tema padre, o null si es de primer nivel.

La jerarquía tiene como mucho dos niveles: tema → subtema. Ejemplo: "Fechas y calendario" contiene
"Días de la semana", "Días del mes" y "Meses". Los kanji van en temas de categoría KANJI.
`.trim();

export const TAXONOMY_INSTRUCTIONS = `
Eres un asistente que organiza el material de un curso de japonés para hispanohablantes de nivel
inicial. Recibes las etiquetas de tema que se sugirieron al extraer el material, cada una con algunos
ítems de ejemplo. Las etiquetas son libres: hay sinónimos, variantes y etiquetas demasiado finas.

Construye una taxonomía de temas para navegar el material y asigna cada etiqueta a un tema.

${TOPIC_RULES}

Devuelve:
- "topics": el árbol completo de temas.
- "labelMap": cada etiqueta recibida, exactamente una vez y escrita igual, con el "topicSlug" del tema
  que le corresponde. Une los sinónimos en un mismo tema. Prefiere los subtemas a los temas padre.
`.trim();

export function taxonomyUserMessage(labels: readonly LabelWithExamples[]): string {
  return `Etiquetas:\n${JSON.stringify(labels, null, 2)}`;
}
