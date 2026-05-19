// Cliente HTTP compartido. Las rutas se prefijan con `/api` y vite las redirige
// al backend (ver vite.config.ts).

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
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', json: body })
}

// Compone `?page=…&pageSize=…&...extras` a partir de un objeto.
export function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  )
  if (entries.length === 0) return ''
  const usp = new URLSearchParams()
  for (const [k, v] of entries) usp.set(k, String(v))
  return `?${usp.toString()}`
}
