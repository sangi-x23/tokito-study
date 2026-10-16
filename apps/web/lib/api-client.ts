// Cliente HTTP de la API: URL base, caché y manejo de errores. No sabe nada
// de temas ni de ítems; los endpoints viven en el `api/` de cada módulo.
// Corre solo en el servidor de Next.

// Igual que el `s-maxage` de la API: el contenido cambia como mucho una vez
// al día, con la ingesta.
const REVALIDATE_SECONDS = 3600;

/**
 * Para los catálogos cerrados (kana, kanji y vocabulario), que solo cambian
 * con su seed: igual que `CATALOG_CACHE` en la API.
 */
export const CATALOG_REVALIDATE_SECONDS = 86400;

/** El `Cache-Control` de los Route Handlers que devuelven datos de un catálogo. */
export const CATALOG_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=2592000';

/**
 * La URL de la API solo existe en el servidor de Next: el navegador nunca la
 * llama, así que no hace falta CORS ni exponerla con `NEXT_PUBLIC_`.
 */
function apiUrl(path: string): string {
  const base = process.env.API_URL;
  if (!base) {
    throw new Error('Falta API_URL en apps/web/.env.local (por ejemplo, http://localhost:3001).');
  }
  return new URL(path, base).toString();
}

/**
 * Devuelve null si el recurso no existe, para que la página responda con
 * `notFound()`. Un 400 también cuenta: es un slug o un id con forma inválida
 * en la URL, que para quien navega es lo mismo que uno que no existe.
 */
export async function get<T>(path: string, revalidate: number = REVALIDATE_SECONDS): Promise<T | null> {
  const response = await fetch(apiUrl(path), { next: { revalidate } });

  if (response.status === 404 || response.status === 400) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} en ${path}`);
  }
  return (await response.json()) as T;
}
