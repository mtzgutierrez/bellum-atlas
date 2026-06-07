// Cliente HTTP compartido. Las rutas se prefijan con `/api` y vite las redirige
// al backend (ver vite.config.ts), reescribiendo `/api` → `` .

const BASE = '/api'

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginationQuery {
  page?: number
  pageSize?: number
}

// Error con el status HTTP accesible, para distinguir 202 (pending) y demás
// códigos en las pantallas.
export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const url = `${BASE}${path}`
  const { json, ...rest } = init ?? {}
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string })
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', json: body })
}

// Variante que expone el status incluso en respuestas OK (para 200 vs 202).
export async function getWithStatus<T>(
  path: string,
): Promise<{ status: number; data: T }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string })
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
  }
  return { status: res.status, data: (await res.json()) as T }
}

// Compone `?page=…&pageSize=…&...extras` a partir de un objeto.
export function qs(
  params: Record<string, string | number | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  )
  if (entries.length === 0) return ''
  const usp = new URLSearchParams()
  for (const [k, v] of entries) usp.set(k, String(v))
  return `?${usp.toString()}`
}
