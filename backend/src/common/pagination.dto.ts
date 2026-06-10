import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Los query params llegan siempre como string; los normalizamos manualmente
// con normalizePagination().
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Página, 1-indexed', default: 1 })
  page?: string;

  @ApiPropertyOptional({
    description: `Items por página (máx ${MAX_PAGE_SIZE})`,
    default: DEFAULT_PAGE_SIZE,
  })
  pageSize?: string;
}

export class PaginationMetaDto {
  @ApiProperty()
  total!: number;
  @ApiProperty()
  page!: number;
  @ApiProperty()
  pageSize!: number;
  @ApiProperty()
  totalPages!: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMetaDto;
}

/**
 * Normaliza los query params: page ≥ 1, pageSize ∈ [1, 50]. Inputs inválidos
 * caen a defaults razonables en vez de devolver 400 (UX más amable).
 */
export function normalizePagination(query: PaginationQueryDto): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const rawPage = Number(query.page);
  const rawSize = Number(query.pageSize);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawSize) && rawSize > 0
      ? Math.min(Math.floor(rawSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMetaDto {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
