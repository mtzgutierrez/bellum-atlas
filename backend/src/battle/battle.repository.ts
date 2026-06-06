import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Lo mínimo necesario para pintar un marker en Leaflet. Sin imágenes ni
// summaries: queremos respuestas de pocos KB aunque haya miles de puntos.
const POINT_SELECT = {
  id: true,
  name: true,
  slug: true,
  year: true,
  latitude: true,
  longitude: true,
  type: true,
  importanceScore: true,
} satisfies Prisma.BattleSelect;

export type BattlePoint = Prisma.BattleGetPayload<{ select: typeof POINT_SELECT }>;

const SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  year: true,
  startYear: true,
  endYear: true,
  latitude: true,
  longitude: true,
  imageUrl: true,
  type: true,
  importanceScore: true,
} satisfies Prisma.BattleSelect;

export type BattleSummary = Prisma.BattleGetPayload<{ select: typeof SUMMARY_SELECT }>;

const DETAIL_INCLUDE = {
  aiSummary: { select: { id: true } },
} satisfies Prisma.BattleInclude;

export type BattleWithRelations = Prisma.BattleGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export type BattleFilters = {
  yearMin?: number;
  yearMax?: number;
  bbox?: { north: number; south: number; east: number; west: number };
  search?: string;
  minImportance?: number;
};

@Injectable()
export class BattleRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Endpoint /battles/points: todos los markers del mapa ──────────────
  // El cliente luego clusteriza con leaflet.markercluster. Cap a 10k para
  // protegernos de payloads gigantes; el frontend pagina por importancia.
  findPoints(filters: BattleFilters, limit = 10000): Promise<BattlePoint[]> {
    return this.prisma.battle.findMany({
      where: this.buildWhere(filters, { requireCoords: true }),
      select: POINT_SELECT,
      orderBy: { importanceScore: 'desc' },
      take: limit,
    });
  }

  // ─── Endpoint /battles: paginado para sidebar ──────────────────────────
  findPaginated(
    filters: BattleFilters,
    skip: number,
    take: number,
  ): Promise<BattleSummary[]> {
    return this.prisma.battle.findMany({
      where: this.buildWhere(filters),
      select: SUMMARY_SELECT,
      orderBy: [{ importanceScore: 'desc' }, { year: 'asc' }],
      skip,
      take,
    });
  }

  count(filters: BattleFilters): Promise<number> {
    return this.prisma.battle.count({ where: this.buildWhere(filters) });
  }

  // ─── Endpoint /battles/:id ─────────────────────────────────────────────
  findByIdOrSlug(id: string): Promise<BattleWithRelations | null> {
    return this.prisma.battle.findFirst({
      where: { OR: [{ slug: id }, ...(isUuid(id) ? [{ id }] : [])] },
      include: DETAIL_INCLUDE,
    });
  }

  // ─── WHERE compartido (filtra null coords cuando lo pedimos) ───────────
  private buildWhere(
    f: BattleFilters,
    opts: { requireCoords?: boolean } = {},
  ): Prisma.BattleWhereInput {
    const and: Prisma.BattleWhereInput[] = [];

    // Solapamiento de rangos: [startYear, endYear] ∩ [yearMin, yearMax].
    // Usamos year como fallback cuando no hay rango.
    if (f.yearMin != null || f.yearMax != null) {
      const yMin = f.yearMin ?? Number.MIN_SAFE_INTEGER;
      const yMax = f.yearMax ?? Number.MAX_SAFE_INTEGER;
      and.push({
        OR: [
          { year: { gte: yMin, lte: yMax } },
          {
            AND: [
              { startYear: { lte: yMax } },
              { endYear: { gte: yMin } },
            ],
          },
        ],
      });
    }

    if (f.bbox) {
      and.push({
        latitude: { gte: f.bbox.south, lte: f.bbox.north },
        longitude: { gte: f.bbox.west, lte: f.bbox.east },
      });
    } else if (opts.requireCoords) {
      and.push({ latitude: { not: null }, longitude: { not: null } });
    }

    if (f.search && f.search.trim().length > 0) {
      and.push({ name: { contains: f.search.trim(), mode: 'insensitive' } });
    }

    if (f.minImportance != null) {
      and.push({ importanceScore: { gte: f.minImportance } });
    }

    return and.length > 0 ? { AND: and } : {};
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
