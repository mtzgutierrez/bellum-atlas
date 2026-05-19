import { get, post, qs, type Paginated, type PaginationQuery } from './api'
import type {
  CommanderDetail,
  CommanderSummary,
  CommanderYearsQuery,
} from './commander.types'

export type CommanderSortBy = 'name' | 'birth'

interface CommanderListQuery extends PaginationQuery {
  sortBy?: CommanderSortBy
}

export const commanderService = {
  listar: (p?: CommanderListQuery) =>
    get<Paginated<CommanderSummary>>('/commander' + qs({ ...p })),

  buscarPorNombre: (nombre: string, p?: CommanderListQuery) =>
    get<Paginated<CommanderSummary>>(
      `/commander/search/${encodeURIComponent(nombre)}` + qs({ ...p }),
    ),

  buscarPorPais: (pais: string, p?: CommanderListQuery) =>
    get<Paginated<CommanderSummary>>(
      `/commander/country/${encodeURIComponent(pais)}` + qs({ ...p }),
    ),

  buscarPorAnios: (query: CommanderYearsQuery, p?: CommanderListQuery) =>
    post<Paginated<CommanderSummary>>(
      '/commander/years' + qs({ ...p }),
      query,
    ),

  detalle: (idOrSlug: string) =>
    get<CommanderDetail>(`/commander/${encodeURIComponent(idOrSlug)}`),
}
