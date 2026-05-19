import { get, post, qs, type Paginated, type PaginationQuery } from './api'
import type { WarDetail, WarSummary, WarTimePeriodQuery } from './war.types'

export const warService = {
  listar: (p?: PaginationQuery) =>
    get<Paginated<WarSummary>>('/war' + qs({ ...p })),

  buscarPorNombre: (nombre: string, p?: PaginationQuery) =>
    get<Paginated<WarSummary>>(
      `/war/search/${encodeURIComponent(nombre)}` + qs({ ...p }),
    ),

  buscarPorPeriodo: (query: WarTimePeriodQuery, p?: PaginationQuery) =>
    post<Paginated<WarSummary>>('/war/time-period' + qs({ ...p }), query),

  detalle: (idOrSlug: string) =>
    get<WarDetail>(`/war/${encodeURIComponent(idOrSlug)}`),
}
