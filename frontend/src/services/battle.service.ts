import { get, qs, type Paginated } from './api'
import type {
  BattleDetail,
  BattlePoint,
  BattleQuery,
  BattleSummary,
} from './battle.types'

// Traduce el objeto de filtros del frontend a query params del backend.
function buildQuery(q?: BattleQuery): string {
  if (!q) return ''
  return qs({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    yearMin: q.yearMin,
    yearMax: q.yearMax,
    minImportance: q.minImportance,
    bboxN: q.bboxN,
    bboxS: q.bboxS,
    bboxE: q.bboxE,
    bboxW: q.bboxW,
  })
}

export const battleService = {
  // Listado paginado (sidebar / catálogo). Acepta búsqueda y rango de años.
  listar: (q?: BattleQuery) =>
    get<Paginated<BattleSummary>>('/battles' + buildQuery(q)),

  // Puntos ligeros para pintar el mapa (sin paginar; el backend capa a 10k).
  puntos: (q?: BattleQuery) =>
    get<BattlePoint[]>('/battles/points' + buildQuery(q)),

  // Detalle por id o slug.
  detalle: (idOrSlug: string) =>
    get<BattleDetail>(`/battles/${encodeURIComponent(idOrSlug)}`),
}
