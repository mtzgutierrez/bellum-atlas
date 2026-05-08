import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCommanderDto } from './dto/query-commander.dto';
import {
  PaginatedResult,
  buildMeta,
  normalisePagination,
} from '../common/utils/pagination.util';

// ─── Includes ──────────────────────────────────────────────────────────────────

const COMMANDER_LIST_INCLUDE = {
  _count: { select: { battles: true } },
  media: {
    where: { isPrimary: true },
    include: { media: { select: { url: true, altText: true } } },
    take: 1,
  },
} satisfies Prisma.CommanderInclude;

const COMMANDER_DETAIL_INCLUDE = {
  battles: {
    include: {
      battleFaction: {
        select: {
          result: true,
          side: true,
          battle: {
            select: { id: true, name: true, slug: true, date: true, type: true },
          },
        },
      },
    },
  },
  wars: {
    include: {
      warFaction: {
        select: {
          result: true,
          side: true,
          war: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
  media: {
    orderBy: { order: 'asc' as const },
    include: { media: true },
  },
} satisfies Prisma.CommanderInclude;

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class CommanderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: QueryCommanderDto): Promise<PaginatedResult<unknown>> {
    const { q } = dto;
    const { page, limit, skip, take } = normalisePagination(dto.page, dto.limit);

    const where: Prisma.CommanderWhereInput = q
      ? { name: { contains: q, mode: 'insensitive' } }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.commander.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: COMMANDER_LIST_INCLUDE,
      }),
      this.prisma.commander.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string): Promise<unknown> {
    const commander = await this.prisma.commander.findUnique({
      where: { id },
      include: COMMANDER_DETAIL_INCLUDE,
    });

    if (!commander) {
      throw new NotFoundException(`Comandante con id "${id}" no encontrado`);
    }

    // Build flat battle history from CommanderBattleFaction
    const battles = commander.battles.map((cbf) => ({
      id: cbf.battleFaction.battle.id,
      name: cbf.battleFaction.battle.name,
      slug: cbf.battleFaction.battle.slug,
      date: cbf.battleFaction.battle.date,
      type: cbf.battleFaction.battle.type,
      personalResult: cbf.battleFaction.result,
      side: cbf.battleFaction.side,
    }));

    const total = battles.length;
    const victories = battles.filter((b) => b.personalResult === 'victory').length;
    const winRate = total > 0 ? Math.round((victories / total) * 100) / 100 : 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { battles: _raw, ...rest } = commander;

    return {
      ...rest,
      battles,
      stats: { total, victories, winRate },
    };
  }
}
