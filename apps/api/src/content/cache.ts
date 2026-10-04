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
 * Pone `PUBLIC_CACHE` solo en las respuestas que salen bien. `@Header` la
 * pondría también en un 404, y el CDN seguiría diciendo que un tema no existe
 * después de que la ingesta lo creara.
 */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(tap(() => context.switchToHttp().getResponse<Response>().setHeader('Cache-Control', PUBLIC_CACHE)));
  }
}
