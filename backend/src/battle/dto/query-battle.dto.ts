import { BattleType } from '@prisma/client';

export class QueryBattleDto {
  /** Búsqueda full-text: nombre, guerra o lugar. */
  q?: string;

  /** Slug de `HistoricalEra` (ej: "ancient", "medieval"). */
  era?: string;

  /** Resultado: "victory" | "defeat" | "draw" | "inconclusive". */
  result?: string;

  /** Tipo de batalla. */
  type?: BattleType;

  /** País involucrado (se busca en `location.country`). */
  country?: string;

  /** Número de página (default: 1). */
  page?: number;

  /** Ítems por página (default: 20, max: 100). */
  limit?: number;

  /** Campo de ordenación: "date" | "name" (default: "date"). */
  sortBy?: 'date' | 'name';
}
