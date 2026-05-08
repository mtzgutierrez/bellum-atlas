export class QueryWarDto {
  /** Búsqueda por nombre de guerra. */
  q?: string;

  /** Número de página (default: 1). */
  page?: number;

  /** Ítems por página (default: 20, max: 100). */
  limit?: number;
}
