import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';

// Lee el header Authorization si existe y poppleta req.auth. NO falla si no
// hay token; los guards individuales deciden si lo exigen.
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly auth: AuthService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const payload = this.auth.verify(token);
    if (payload) {
      req.auth = { userId: payload.sub, tier: payload.tier };
    }
    next();
  }
}
