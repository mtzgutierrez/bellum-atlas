import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const WAR_DETAIL_INCLUDE = {
  battles: {
    orderBy: [
      { battle: { date: 'asc' as const } },
      { battle: { dateStart: 'asc' as const } },
    ],
    include: {
      battle: {
        select: {
          id: true,
          name: true,
          slug: true,
          date: true,
          dateStart: true,
          dateEnd: true,
        },
      },
    },
  },
  factions: {
    orderBy: { side: 'asc' as const },
    include: {
      faction: {
        select: { id: true, name: true, slug: true, flagUrl: true },
      },
    },
  },
  commanders: {
    include: {
      commander: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.WarInclude;

export type WarWithRelations = Prisma.WarGetPayload<{
  include: typeof WAR_DETAIL_INCLUDE;
}>;

const SIMPLIFIED_SELECT = {
  id: true,
  name: true,
  slug: true,
  dateStart: true,
  dateEnd: true,
  imageUrl: true,
  wikipediaUrl: true,
} satisfies Prisma.WarSelect;

export type WarSimplified = Prisma.WarGetPayload<{
  select: typeof SIMPLIFIED_SELECT;
}>;

type Page = { skip: number; take: number };

@Injectable()
export class WarRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(page: Page): Promise<WarSimplified[]> {
    return this.prisma.war.findMany({
      select: SIMPLIFIED_SELECT,
      orderBy: { dateStart: 'asc' },
      ...page,
    });
  }

  contar(): Promise<number> {
    return this.prisma.war.count();
  }

  buscarPorNombre(nombre: string, page: Page): Promise<WarSimplified[]> {
    return this.prisma.war.findMany({
      where: this.whereNombre(nombre),
      select: SIMPLIFIED_SELECT,
      orderBy: { name: 'asc' },
      ...page,
    });
  }

  contarPorNombre(nombre: string): Promise<number> {
    return this.prisma.war.count({ where: this.whereNombre(nombre) });
  }

  buscarPorPeriodo(
    startDate: Date,
    endDate: Date,
    page: Page,
  ): Promise<WarSimplified[]> {
    return this.prisma.war.findMany({
      where: this.wherePeriodo(startDate, endDate),
      select: SIMPLIFIED_SELECT,
      orderBy: { dateStart: 'asc' },
      ...page,
    });
  }

  contarPorPeriodo(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.war.count({ where: this.wherePeriodo(startDate, endDate) });
  }

  buscarPorId(id: string): Promise<WarWithRelations | null> {
    return this.prisma.war.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: WAR_DETAIL_INCLUDE,
    });
  }

  private whereNombre(nombre: string): Prisma.WarWhereInput {
    return { name: { contains: nombre, mode: 'insensitive' } };
  }

  private wherePeriodo(startDate: Date, endDate: Date): Prisma.WarWhereInput {
    return {
      AND: [
        { dateStart: { not: null, lte: endDate } },
        { dateEnd: { not: null, gte: startDate } },
      ],
    };
  }
}
