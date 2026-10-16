import type { NextRequest } from 'next/server';
import { CATALOG_CACHE_CONTROL } from '@/lib/api-client';
import { getVocabularyWord } from '@/modules/vocabulary/api/vocabulary';

/**
 * El detalle de una palabra para su modal, como `datos/kanji`: el navegador
 * no llama a la API, así que lo pide aquí. Se cachea como la API, solo si
 * existe.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<'/datos/vocabulario/[id]'>): Promise<Response> {
  const word = await getVocabularyWord((await ctx.params).id);
  if (!word) {
    return Response.json({ message: 'Palabra no encontrada' }, { status: 404 });
  }
  return Response.json(word, {
    headers: { 'Cache-Control': CATALOG_CACHE_CONTROL },
  });
}
