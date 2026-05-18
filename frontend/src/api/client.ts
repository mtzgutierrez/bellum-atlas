import type {
  PaginatedResponse,
  ApiBattleListItem,
  ApiBattleDetail,
  ApiWarListItem,
  ApiWarDetail,
  ApiCommanderListItem,
  ApiCommanderDetail,
} from './types'

type Params = Record<string, string | number | boolean | undefined>

async function get<T>(path: string, params?: Params): Promise<T> {
  const url = new URL(`/api${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Battles ───────────────────────────────────────────────────────────────────

export interface BattleQueryParams {
  q?: string
  era?: string
  type?: string
  result?: string
  country?: string
  page?: number
  limit?: number
  sortBy?: 'date' | 'name'
}

export function fetchBattles(params?: BattleQueryParams) {
  return get<PaginatedResponse<ApiBattleListItem>>('/battles', params as Params)
}

export function fetchBattle(idOrSlug: string) {
  return get<ApiBattleDetail>(`/battles/${idOrSlug}`)
}

// ── Wars ──────────────────────────────────────────────────────────────────────

export interface WarQueryParams {
  q?: string
  page?: number
  limit?: number
}

export function fetchWars(params?: WarQueryParams) {
  return get<PaginatedResponse<ApiWarListItem>>('/wars', params as Params)
}

export function fetchWar(idOrSlug: string) {
  return get<ApiWarDetail>(`/wars/${idOrSlug}`)
}

// ── Commanders ────────────────────────────────────────────────────────────────

export interface CommanderQueryParams {
  q?: string
  page?: number
  limit?: number
}

export function fetchCommanders(params?: CommanderQueryParams) {
  return get<PaginatedResponse<ApiCommanderListItem>>('/commanders', params as Params)
}

export function fetchCommander(idOrSlug: string) {
  return get<ApiCommanderDetail>(`/commanders/${idOrSlug}`)
}
