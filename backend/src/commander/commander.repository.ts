import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  birthYear: true,
  deathYear: true,
  imageUrl: true,
} satisfies Prisma.CommanderSelect;

export type CommanderSummary = Prisma.CommanderGetPayload<{ select: typeof SUMMARY_SELECT }>;

const DETAIL_INCLUDE = {
  battles: {
    orderBy: { battle: { year: 'asc' as const } },
    include: {
      battle: { select: { id: true, name: true, slug: true, year: true } },
    },
  },
} satisfies Prisma.CommanderInclude;

export type CommanderWithRelations = Prisma.CommanderGetPayload<{ include: typeof DETAIL_INCLUDE }>;

@Injectable()
export class CommanderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPaginated(search: string | undefined, skip: number, take: number): Promise<CommanderSummary[]> {
    return this.prisma.commander.findMany({
      where: this.where(search),
      select: SUMMARY_SELECT,
      orderBy: { name: 'asc' },
      skip,
      take,
    });
  }

  count(search: string | undefined): Promise<number> {
    return this.prisma.commander.count({ where: this.where(search) });
  }

  findByIdOrSlug(id: string): Promise<CommanderWithRelations | null> {
    return this.prisma.commander.findFirst({
      where: { OR: [{ slug: id }, ...(isUuid(id) ? [{ id }] : [])] },
      include: DETAIL_INCLUDE,
    });
  }

  private where(search: string | undefined): Prisma.CommanderWhereInput {
    if (!search?.trim()) return {};
    return { name: { contains: search.trim(), mode: 'insensitive' } };
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
