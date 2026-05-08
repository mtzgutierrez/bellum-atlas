export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

export function buildMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/** Clamps limit to [1, MAX_LIMIT] and ensures page >= 1. */
export function normalisePagination(
  page: number = 1,
  limit: number = DEFAULT_LIMIT,
): { page: number; limit: number; skip: number; take: number } {
  const p = Math.max(1, page);
  const l = Math.min(Math.max(1, limit), MAX_LIMIT);
  return { page: p, limit: l, skip: (p - 1) * l, take: l };
}
