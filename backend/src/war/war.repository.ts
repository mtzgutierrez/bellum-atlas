import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  startYear: true,
  endYear: true,
  imageUrl: true,
  region: true,
} satisfies Prisma.WarSelect;

export type WarSummary = Prisma.WarGetPayload<{ select: typeof SUMMARY_SELECT }>;

const DETAIL_INCLUDE = {
  battles: {
    orderBy: { battle: { year: 'asc' as const } },
    include: {
      battle: {
        select: { id: true, name: true, slug: true, year: true, latitude: true, longitude: true },
      },
    },
  },
} satisfies Prisma.WarInclude;

export type WarWithRelations = Prisma.WarGetPayload<{ include: typeof DETAIL_INCLUDE }>;

export type WarFilters = {
  search?: string;
  yearMin?: number;
  yearMax?: number;
};

@Injectable()
export class WarRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPaginated(filters: WarFilters, skip: number, take: number): Promise<WarSummary[]> {
    return this.prisma.war.findMany({
      where: this.buildWhere(filters),
      select: SUMMARY_SELECT,
      orderBy: { startYear: 'asc' },
      skip,
      take,
    });
  }

  count(filters: WarFilters): Promise<number> {
    return this.prisma.war.count({ where: this.buildWhere(filters) });
  }

  findByIdOrSlug(id: string): Promise<WarWithRelations | null> {
    return this.prisma.war.findFirst({
      where: { OR: [{ slug: id }, ...(isUuid(id) ? [{ id }] : [])] },
      include: DETAIL_INCLUDE,
    });
  }

  private buildWhere(f: WarFilters): Prisma.WarWhereInput {
    const and: Prisma.WarWhereInput[] = [];
    if (f.search?.trim()) {
      and.push({ name: { contains: f.search.trim(), mode: 'insensitive' } });
    }
    if (f.yearMin != null || f.yearMax != null) {
      const yMin = f.yearMin ?? Number.MIN_SAFE_INTEGER;
      const yMax = f.yearMax ?? Number.MAX_SAFE_INTEGER;
      and.push({ AND: [{ startYear: { lte: yMax } }, { endYear: { gte: yMin } }] });
    }
    return and.length > 0 ? { AND: and } : {};
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
