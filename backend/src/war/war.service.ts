import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryWarDto } from './dto/query-war.dto';
import {
  PaginatedResult,
  buildMeta,
  normalisePagination,
} from '../common/utils/pagination.util';

// ─── Includes ──────────────────────────────────────────────────────────────────

const WAR_LIST_INCLUDE = {
  era: { select: { name: true, slug: true } },
  location: { select: { name: true, country: true } },
  _count: { select: { battles: true } },
} satisfies Prisma.WarInclude;

const WAR_DETAIL_INCLUDE = {
  era: true,
  location: true,
  factions: {
    include: {
      commanders: {
        include: {
          commander: { select: { id: true, name: true, country: true } },
        },
      },
    },
  },
  battles: {
    orderBy: { battle: { date: 'asc' as const } },
    include: {
      battle: {
        select: {
          id: true,
          name: true,
          slug: true,
          date: true,
          result: true,
          type: true,
        },
      },
    },
  },
  media: {
    orderBy: { order: 'asc' as const },
    include: { media: true },
  },
} satisfies Prisma.WarInclude;

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class WarService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: QueryWarDto): Promise<PaginatedResult<unknown>> {
    const { q } = dto;
    const { page, limit, skip, take } = normalisePagination(dto.page, dto.limit);

    const where: Prisma.WarWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.war.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: 'asc' },
        include: WAR_LIST_INCLUDE,
      }),
      this.prisma.war.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(idOrSlug: string): Promise<unknown> {
    const war = await this.prisma.war.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: WAR_DETAIL_INCLUDE,
    });

    if (!war) {
      throw new NotFoundException(`Guerra "${idOrSlug}" no encontrada`);
    }

    const totalBattles = war.battles.length;

    const durationDays =
      war.startDate && war.endDate
        ? Math.floor(
            (war.endDate.getTime() - war.startDate.getTime()) / 86_400_000,
          )
        : null;

    return {
      ...war,
      stats: { totalBattles, durationDays },
    };
  }
}
