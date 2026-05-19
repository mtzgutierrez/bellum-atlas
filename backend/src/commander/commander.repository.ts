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

const DEFAULT_LIST_TAKE = 100;

@Injectable()
export class CommanderRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<CommanderSimplified[]> {
    return this.prisma.commander.findMany({
      select: SIMPLIFIED_SELECT,
      orderBy: { name: 'asc' },
      take: DEFAULT_LIST_TAKE,
    });
  }

  // Búsqueda no exacta sobre nombre y aliases. `aliases.has` exige match
  // exacto en algún elemento del array → combinamos con `contains` sobre name
  // para cubrir el caso parcial.
  buscarPorNombre(nombre: string): Promise<CommanderSimplified[]> {
    return this.prisma.commander.findMany({
      where: {
        OR: [
          { name: { contains: nombre, mode: 'insensitive' } },
          { aliases: { has: nombre } },
        ],
      },
      select: SIMPLIFIED_SELECT,
      orderBy: { name: 'asc' },
      take: DEFAULT_LIST_TAKE,
    });
  }

  buscarPorPais(pais: string): Promise<CommanderSimplified[]> {
    return this.prisma.commander.findMany({
      where: {
        nationality: { contains: pais, mode: 'insensitive' },
      },
      select: SIMPLIFIED_SELECT,
      orderBy: { name: 'asc' },
      take: DEFAULT_LIST_TAKE,
    });
  }

  // "Vivo entre dos años": [birthYear, deathYear] se solapa con [start, end].
  // Aceptamos comandantes sin deathDate si nacieron antes/durante endYear.
  buscarPorAnios(
    startYear: number,
    endYear: number,
  ): Promise<CommanderSimplified[]> {
    const startBound = new Date(Date.UTC(startYear, 0, 1));
    const endBound = new Date(Date.UTC(endYear, 11, 31, 23, 59, 59));
    return this.prisma.commander.findMany({
      where: {
        AND: [
          { birthDate: { not: null, lte: endBound } },
          {
            OR: [
              { deathDate: { gte: startBound } },
              { deathDate: null },
            ],
          },
        ],
      },
      select: SIMPLIFIED_SELECT,
      orderBy: { birthDate: 'asc' },
    });
  }

  buscarPorId(id: string): Promise<CommanderWithRelations | null> {
    return this.prisma.commander.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: COMMANDER_DETAIL_INCLUDE,
    });
  }
}
