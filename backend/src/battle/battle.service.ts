import { Injectable, NotFoundException } from '@nestjs/common';
import { BattleType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryBattleDto } from './dto/query-battle.dto';
import {
  PaginatedResult,
  buildMeta,
  normalisePagination,
} from '../common/utils/pagination.util';

// ─── Includes ──────────────────────────────────────────────────────────────────

const BATTLE_LIST_INCLUDE = {
  era: { select: { name: true, slug: true } },
  location: { select: { name: true, country: true, lat: true, lon: true } },
  wars: {
    include: {
      war: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.BattleInclude;

const BATTLE_DETAIL_INCLUDE = {
  era: true,
  location: true,
  wars: {
    include: {
      war: { select: { id: true, name: true, slug: true } },
    },
  },
  factions: {
    orderBy: { side: 'asc' as const },
    include: {
      commanders: {
        include: {
          commander: { select: { id: true, name: true, country: true } },
        },
      },
    },
  },
  media: {
    orderBy: { order: 'asc' as const },
    include: { media: true },
  },
} satisfies Prisma.BattleInclude;

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class BattleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: QueryBattleDto): Promise<PaginatedResult<unknown>> {
    const { q, era, result, type, country, sortBy = 'date' } = dto;
    const { page, limit, skip, take } = normalisePagination(dto.page, dto.limit);

    const where: Prisma.BattleWhereInput = {
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { wars: { some: { war: { name: { contains: q, mode: 'insensitive' } } } } },
          { location: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
      ...(era && { era: { slug: era } }),
      ...(result && { result }),
      ...(type && { type: type as BattleType }),
      ...(country && {
        location: { country: { contains: country, mode: 'insensitive' } },
      }),
    };

    const orderBy: Prisma.BattleOrderByWithRelationInput =
      sortBy === 'name' ? { name: 'asc' } : { date: 'asc' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.battle.findMany({
        where,
        skip,
        take,
        orderBy,
        include: BATTLE_LIST_INCLUDE,
      }),
      this.prisma.battle.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(idOrSlug: string): Promise<unknown> {
    const battle = await this.prisma.battle.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: BATTLE_DETAIL_INCLUDE,
    });

    if (!battle) {
      throw new NotFoundException(`Batalla "${idOrSlug}" no encontrada`);
    }

    // Related battles from the same wars (up to 5)
    const warIds = battle.wars.map((bw) => bw.warId);
    const relatedBattles = warIds.length
      ? await this.prisma.battle.findMany({
          where: {
            wars: { some: { warId: { in: warIds } } },
            NOT: { id: battle.id },
          },
          take: 5,
          select: {
            id: true,
            name: true,
            slug: true,
            date: true,
            result: true,
            type: true,
          },
        })
      : [];

    return { ...battle, relatedBattles };
  }
}
