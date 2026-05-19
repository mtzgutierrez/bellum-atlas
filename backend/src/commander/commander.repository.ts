import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCommanderDto } from './dto/query-commander.dto';

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
            select: {
              id: true,
              name: true,
              slug: true,
              date: true,
              type: true,
            },
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

export type CommanderListItem = Prisma.CommanderGetPayload<{
  include: typeof COMMANDER_LIST_INCLUDE;
}>;
export type CommanderDetail = Prisma.CommanderGetPayload<{
  include: typeof COMMANDER_DETAIL_INCLUDE;
}>;

@Injectable()
export class CommanderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(dto: QueryCommanderDto, skip: number, take: number): Promise<[CommanderListItem[], number]> {
    const where: Prisma.CommanderWhereInput = dto.q
      ? { name: { contains: dto.q, mode: 'insensitive' } }
      : {};

    return this.prisma.$transaction([
      this.prisma.commander.findMany({ where, skip, take, orderBy: { name: 'asc' }, include: COMMANDER_LIST_INCLUDE }),
      this.prisma.commander.count({ where }),
    ]);
  }

  findById(id: string): Promise<CommanderDetail | null> {
    return this.prisma.commander.findUnique({
      where: { id },
      include: COMMANDER_DETAIL_INCLUDE,
    });
  }
}
