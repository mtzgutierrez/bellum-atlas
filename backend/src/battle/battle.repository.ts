import { Injectable } from '@nestjs/common';
import { BattleType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryBattleDto } from './dto/query-battle.dto';

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

export type BattleListItem = Prisma.BattleGetPayload<{
  include: typeof BATTLE_LIST_INCLUDE;
}>;
export type BattleDetail = Prisma.BattleGetPayload<{
  include: typeof BATTLE_DETAIL_INCLUDE;
}>;
export type RelatedBattle = {
  id: string;
  name: string;
  slug: string;
  date: Date | null;
  result: string | null;
  type: Prisma.BattleGetPayload<Record<string, never>>['type'];
};

@Injectable()
export class BattleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(
    dto: QueryBattleDto,
    skip: number,
    take: number,
  ): Promise<[BattleListItem[], number]> {
    const { q, era, result, type, country, sortBy = 'date' } = dto;

    const where: Prisma.BattleWhereInput = {
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          {
            wars: {
              some: { war: { name: { contains: q, mode: 'insensitive' } } },
            },
          },
          { location: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
      ...(era && { era: { slug: era } }),
      ...(result && { result }),
      ...(type && { type: type }),
      ...(country && {
        location: { country: { contains: country, mode: 'insensitive' } },
      }),
    };

    const orderBy: Prisma.BattleOrderByWithRelationInput =
      sortBy === 'name' ? { name: 'asc' } : { date: 'asc' };

    return this.prisma.$transaction([
      this.prisma.battle.findMany({
        where,
        skip,
        take,
        orderBy,
        include: BATTLE_LIST_INCLUDE,
      }),
      this.prisma.battle.count({ where }),
    ]);
  }

  findByIdOrSlug(idOrSlug: string): Promise<BattleDetail | null> {
    return this.prisma.battle.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: BATTLE_DETAIL_INCLUDE,
    });
  }

  findRelated(warIds: string[], excludeId: string): Promise<RelatedBattle[]> {
    return this.prisma.battle.findMany({
      where: {
        wars: { some: { warId: { in: warIds } } },
        NOT: { id: excludeId },
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
    });
  }
}
