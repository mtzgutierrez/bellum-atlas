import { get, post, qs, type Paginated, type PaginationQuery } from './api'
import type {
  BattleDetail,
  BattleSummary,
  CoordinatesQuery,
  TimePeriodQuery,
} from './battle.types'

export const battleService = {
  listar: (p?: PaginationQuery) =>
    get<Paginated<BattleSummary>>('/battle' + qs({ ...p })),

  buscarPorNombre: (nombre: string, p?: PaginationQuery) =>
    get<Paginated<BattleSummary>>(
      `/battle/search/${encodeURIComponent(nombre)}` + qs({ ...p }),
    ),

  buscarPorPeriodo: (query: TimePeriodQuery, p?: PaginationQuery) =>
    post<Paginated<BattleSummary>>(
      '/battle/time-period' + qs({ ...p }),
      query,
    ),

  buscarPorCoordenadas: (query: CoordinatesQuery, p?: PaginationQuery) =>
    post<Paginated<BattleSummary>>(
      '/battle/coordinates' + qs({ ...p }),
      query,
    ),

  buscarPorGuerra: (warId: string, p?: PaginationQuery) =>
    get<Paginated<BattleSummary>>(
      `/battle/war/${encodeURIComponent(warId)}` + qs({ ...p }),
    ),

  buscarPorComandante: (commanderId: string, p?: PaginationQuery) =>
    get<Paginated<BattleSummary>>(
      `/battle/commander/${encodeURIComponent(commanderId)}` + qs({ ...p }),
    ),

  batallaDelDia: () => get<BattleDetail>('/battle/random'),

  detalle: (idOrSlug: string) =>
    get<BattleDetail>(`/battle/${encodeURIComponent(idOrSlug)}`),
}
