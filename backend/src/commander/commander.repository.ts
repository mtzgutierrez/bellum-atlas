import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const COMMANDER_DETAIL_INCLUDE = {
  ranks: {
    orderBy: { dateStart: 'asc' as const },
  },
  wars: {
    include: {
      war: { select: { id: true, name: true, slug: true } },
    },
  },
  battleFactions: {
    include: {
      battleFaction: {
        include: {
          battle: {
            select: { id: true, name: true, slug: true, date: true },
          },
          faction: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.CommanderInclude;

export type CommanderWithRelations = Prisma.CommanderGetPayload<{
  include: typeof COMMANDER_DETAIL_INCLUDE;
}>;

const SIMPLIFIED_SELECT = {
  id: true,
  name: true,
  slug: true,
  birthDate: true,
  deathDate: true,
  nationality: true,
  imageUrl: true,
  wikipediaUrl: true,
} satisfies Prisma.CommanderSelect;

export type CommanderSimplified = Prisma.CommanderGetPayload<{
  select: typeof SIMPLIFIED_SELECT;
}>;

type Page = { skip: number; take: number };
type SortBy = 'name' | 'birth';

function orderFor(sortBy: SortBy): Prisma.CommanderOrderByWithRelationInput[] {
  if (sortBy === 'birth') return [{ birthDate: 'asc' }, { name: 'asc' }];
  return [{ name: 'asc' }];
}

@Injectable()
export class CommanderRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(page: Page, sortBy: SortBy = 'name'): Promise<CommanderSimplified[]> {
    return this.prisma.commander.findMany({
      select: SIMPLIFIED_SELECT,
      orderBy: orderFor(sortBy),
      ...page,
    });
  }

  contar(): Promise<number> {
    return this.prisma.commander.count();
  }

  buscarPorNombre(
    nombre: string,
    page: Page,
    sortBy: SortBy = 'name',
  ): Promise<CommanderSimplified[]> {
    return this.prisma.commander.findMany({
      where: this.whereNombre(nombre),
      select: SIMPLIFIED_SELECT,
      orderBy: orderFor(sortBy),
      ...page,
    });
  }

  contarPorNombre(nombre: string): Promise<number> {
    return this.prisma.commander.count({ where: this.whereNombre(nombre) });
  }

  buscarPorPais(
    pais: string,
    page: Page,
    sortBy: SortBy = 'name',
  ): Promise<CommanderSimplified[]> {
    return this.prisma.commander.findMany({
      where: this.wherePais(pais),
      select: SIMPLIFIED_SELECT,
      orderBy: orderFor(sortBy),
      ...page,
    });
  }

  contarPorPais(pais: string): Promise<number> {
    return this.prisma.commander.count({ where: this.wherePais(pais) });
  }

  buscarPorAnios(
    startYear: number,
    endYear: number,
    page: Page,
    sortBy: SortBy = 'birth',
  ): Promise<CommanderSimplified[]> {
    return this.prisma.commander.findMany({
      where: this.whereAnios(startYear, endYear),
      select: SIMPLIFIED_SELECT,
      orderBy: orderFor(sortBy),
      ...page,
    });
  }

  contarPorAnios(startYear: number, endYear: number): Promise<number> {
    return this.prisma.commander.count({
      where: this.whereAnios(startYear, endYear),
    });
  }

  buscarPorId(id: string): Promise<CommanderWithRelations | null> {
    return this.prisma.commander.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: COMMANDER_DETAIL_INCLUDE,
    });
  }

  // Where helpers privados (reutilizados entre count y findMany).

  private whereNombre(nombre: string): Prisma.CommanderWhereInput {
    return {
      OR: [
        { name: { contains: nombre, mode: 'insensitive' } },
        { aliases: { has: nombre } },
      ],
    };
  }

  private wherePais(pais: string): Prisma.CommanderWhereInput {
    return { nationality: { contains: pais, mode: 'insensitive' } };
  }

  private whereAnios(startYear: number, endYear: number): Prisma.CommanderWhereInput {
    const startBound = new Date(Date.UTC(startYear, 0, 1));
    const endBound = new Date(Date.UTC(endYear, 11, 31, 23, 59, 59));
    return {
      AND: [
        { birthDate: { not: null, lte: endBound } },
        {
          OR: [{ deathDate: { gte: startBound } }, { deathDate: null }],
        },
      ],
    };
  }
}
