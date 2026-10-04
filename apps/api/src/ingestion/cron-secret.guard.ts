import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { loadIngestionEnv } from './config/ingestion.env';

const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

/**
 * Compara el header con el secreto en tiempo constante. Se comparan los
 * hashes y no los textos porque `timingSafeEqual` exige el mismo largo, y
 * cortar antes por largo distinto filtraría el largo del secreto.
 */
export function isAuthorized(header: string | undefined, secret: string): boolean {
  return header !== undefined && timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

/** Deja pasar solo a quien trae `Authorization: Bearer <CRON_SECRET>`. */
@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!isAuthorized(request.headers.authorization, loadIngestionEnv().CRON_SECRET)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
