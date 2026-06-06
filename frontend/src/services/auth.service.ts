import { getToken, post, setToken } from './api'

export type UserTier = 'free' | 'premium'

interface DevTokenResponse {
  token: string
  tier: UserTier
}

// Auth de desarrollo: el backend expone POST /auth/dev-token que firma un JWT
// con el tier pedido (sólo activo cuando NODE_ENV=development). Suficiente
// para demostrar la separación Free / Premium sin montar pagos.
export const authService = {
  // Pide un token con el tier indicado y lo guarda en localStorage.
  async loginDev(tier: UserTier): Promise<UserTier> {
    const res = await post<DevTokenResponse>('/auth/dev-token', { tier })
    setToken(res.token)
    return res.tier
  },

  logout(): void {
    setToken(null)
  },

  // Lee el tier del JWT guardado (decodifica el payload sin verificar firma;
  // la verificación real la hace el backend en cada request).
  currentTier(): UserTier | null {
    const token = getToken()
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { tier?: UserTier }
      return payload.tier ?? null
    } catch {
      return null
    }
  },

  isLoggedIn(): boolean {
    return getToken() != null
  },
}
