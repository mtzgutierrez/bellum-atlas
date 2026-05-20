import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload, UserTier } from './auth.types';

// Servicio mínimo: firma y verifica JWTs. La gestión de usuarios real
// (registro, contraseñas, Stripe) queda para más adelante; el guard sólo
// necesita inspeccionar el token.
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwt: JwtService) {}

  signDevToken(input: {
    userId: string;
    email?: string;
    tier: UserTier;
    ttl?: string;
  }): string {
    const payload: JwtPayload = {
      sub: input.userId,
      email: input.email,
      tier: input.tier,
    };
    const token = this.jwt.sign(payload, { expiresIn: input.ttl ?? '30d' });
    this.logger.log(`Token firmado (dev) para ${input.userId} tier=${input.tier}`);
    return token;
  }

  // Devuelve null en lugar de lanzar: los endpoints free funcionan sin token.
  verify(token: string | undefined): JwtPayload | null {
    if (!token) return null;
    try {
      return this.jwt.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
