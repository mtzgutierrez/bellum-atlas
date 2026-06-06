import { get, qs, type Paginated } from './api'
import type {
  BattleDetail,
  BattlePoint,
  BattleQuery,
  BattleSummary,
  CenturyFacet,
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
    type: q.type,
    sort: q.sort,
    bboxN: q.bboxN,
    bboxS: q.bboxS,
    bboxE: q.bboxE,
    bboxW: q.bboxW,
  })
}

export const battleService = {
  // Listado paginado (catálogo). Acepta búsqueda, rango de años, tipo y orden.
  listar: (q?: BattleQuery) =>
    get<Paginated<BattleSummary>>('/battles' + buildQuery(q)),

  // Puntos ligeros para pintar el mapa (con imagen y fechas para la lista).
  puntos: (q?: BattleQuery) =>
    get<BattlePoint[]>('/battles/points' + buildQuery(q)),

  // Efemérides: batallas de un día como hoy.
  efemerides: () => get<BattleSummary[]>('/battles/on-this-day'),

  // Top batallas para la cronología.
  timeline: (limit = 150) =>
    get<BattleSummary[]>('/battles/timeline' + qs({ limit })),

  // Nº de batallas por siglo (para el selector de la cronología).
  siglos: () => get<CenturyFacet[]>('/battles/centuries'),

  // Detalle por id o slug.
  detalle: (idOrSlug: string) =>
    get<BattleDetail>(`/battles/${encodeURIComponent(idOrSlug)}`),
}
