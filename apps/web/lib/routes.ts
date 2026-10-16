// Todas las URLs de la app salen de aquí, para que mover una sección no
// obligue a perseguir enlaces escritos a mano por las páginas.
export const routes = {
  diary: '/diario',
  topic: (slug: string): string => `/diario/temas/${slug}`,
  item: (id: string): string => `/diario/items/${id}`,
  writing: '/escritura',
  kanaTable: (script: string): string => `/escritura/${script}`,
  kanji: '/escritura/kanji',
  kanjiGrade: (slug: string): string => `/escritura/kanji/grado/${slug}`,
  // Route Handler que el modal de un kanji llama desde el navegador.
  kanjiData: (character: string): string => `/datos/kanji/${encodeURIComponent(character)}`,
  vocabulary: '/vocabulario',
  vocabularyLevel: (slug: string): string => `/vocabulario/nivel/${slug}`,
  // Route Handler que el modal de una palabra llama desde el navegador.
  vocabularyData: (id: string): string => `/datos/vocabulario/${id}`,
} as const;
