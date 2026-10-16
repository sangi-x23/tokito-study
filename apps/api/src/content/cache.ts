import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { tap, type Observable } from 'rxjs';

/**
 * El contenido cambia como mucho una vez al día, con la ingesta. Con esto el
 * CDN de Vercel sirve las respuestas sin despertar a Neon en cada visita, y
 * después de una hora las renueva en segundo plano.
 */
export const PUBLIC_CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';

/**
 * Los catálogos cerrados (kana, kanji y vocabulario) solo cambian cuando se
 * corre su seed. Un día fresco y un mes sirviendo la copia vieja mientras se
 * renueva: así casi ninguna visita espera a que Neon despierte, que tarda
 * varios segundos.
 */
export const CATALOG_CACHE = 'public, s-maxage=86400, stale-while-revalidate=2592000';

/** Pone `Cache-Control` solo cuando la respuesta sale bien. */
function cacheOnSuccess(value: string, context: ExecutionContext, next: CallHandler): Observable<unknown> {
  return next.handle().pipe(tap(() => context.switchToHttp().getResponse<Response>().setHeader('Cache-Control', value)));
}

/**
 * Pone `PUBLIC_CACHE` solo en las respuestas que salen bien. `@Header` la
 * pondría también en un 404, y el CDN seguiría diciendo que un tema no existe
 * después de que la ingesta lo creara.
 */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return cacheOnSuccess(PUBLIC_CACHE, context, next);
  }
}

/** Como `PublicCacheInterceptor`, pero con `CATALOG_CACHE`. */
@Injectable()
export class CatalogCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return cacheOnSuccess(CATALOG_CACHE, context, next);
  }
}
