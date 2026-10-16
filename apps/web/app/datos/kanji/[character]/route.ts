import type { NextRequest } from 'next/server';
import { CATALOG_CACHE_CONTROL } from '@/lib/api-client';
import { getKanji } from '@/modules/kanji/api/kanji';
import { characterFromParam } from '@/modules/kanji/character-param';

/**
 * El detalle de un kanji para su modal. El modal se abre en el navegador,
 * que nunca llama a la API: lo pide aquí y el servidor de Next se lo pide a
 * la API. Se cachea como la API, solo si existe.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<'/datos/kanji/[character]'>): Promise<Response> {
  const kanji = await getKanji(characterFromParam((await ctx.params).character));
  if (!kanji) {
    return Response.json({ message: 'Kanji no encontrado' }, { status: 404 });
  }
  return Response.json(kanji, {
    headers: { 'Cache-Control': CATALOG_CACHE_CONTROL },
  });
}
