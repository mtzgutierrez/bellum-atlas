// Tipos compartidos por el módulo de auth. Sin payment integration: Premium
// es sólo una claim del JWT. Cuando entre Stripe, se firma el mismo token con
// `tier=premium` y nada más cambia.

export type UserTier = 'free' | 'premium';

export interface JwtPayload {
  sub: string;    // user id (uuid o cualquier identificador estable)
  email?: string; // opcional, sólo informativo
  tier: UserTier;
  iat?: number;
  exp?: number;
}

// Lo que adjuntamos a Request tras validar el JWT. Si no hay token válido,
// queda undefined (los endpoints free deben funcionar igual).
export interface AuthContext {
  userId: string;
  tier: UserTier;
}

declare module 'express' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Request {
    auth?: AuthContext;
  }
}
