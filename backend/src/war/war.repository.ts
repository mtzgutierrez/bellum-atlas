import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

export type WarListItem = Prisma.WarGetPayload<{ include: typeof WAR_LIST_INCLUDE }>;
export type WarDetail = Prisma.WarGetPayload<{ include: typeof WAR_DETAIL_INCLUDE }>;

@Injectable()
export class WarRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(
    where: Prisma.WarWhereInput,
    skip: number,
    take: number,
  ): Promise<[WarListItem[], number]> {
    return this.prisma.$transaction([
      this.prisma.war.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: 'asc' },
        include: WAR_LIST_INCLUDE,
      }),
      this.prisma.war.count({ where }),
    ]) as Promise<[WarListItem[], number]>;
  }

  findByIdOrSlug(idOrSlug: string): Promise<WarDetail | null> {
    return this.prisma.war.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: WAR_DETAIL_INCLUDE,
    }) as Promise<WarDetail | null>;
  }
}
