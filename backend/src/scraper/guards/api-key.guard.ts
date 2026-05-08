import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Protege los endpoints internos del scraper.
 * Compara el header `x-api-key` contra `SCRAPER_API_KEY` del entorno.
 * Si la variable de entorno no está definida, rechaza siempre (fail-secure).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedKey = process.env.SCRAPER_API_KEY;

    if (!expectedKey) {
      throw new UnauthorizedException('SCRAPER_API_KEY no configurada en el servidor');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('API key inválida o ausente');
    }

    return true;
  }
}
