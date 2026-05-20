import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

// Bloquea endpoints que requieren tier "premium". Se pone como guard sobre
// el método del controller; el middleware ya habrá rellenado req.auth.
@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.auth) {
      throw new UnauthorizedException('Token requerido (Bearer ...) para esta ruta.');
    }
    if (req.auth.tier !== 'premium') {
      throw new ForbiddenException('Esta funcionalidad requiere tier premium.');
    }
    return true;
  }
}
