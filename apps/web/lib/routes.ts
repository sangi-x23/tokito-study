// Todas las URLs de la app salen de aquí, para que mover una sección no
// obligue a perseguir enlaces escritos a mano por las páginas.
export const routes = {
  diary: '/diario',
  topic: (slug: string): string => `/diario/temas/${slug}`,
  item: (id: string): string => `/diario/items/${id}`,
} as const;
