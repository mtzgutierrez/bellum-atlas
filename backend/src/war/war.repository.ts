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

const DEFAULT_LIST_TAKE = 100;

@Injectable()
export class WarRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<WarSimplified[]> {
    return this.prisma.war.findMany({
      select: SIMPLIFIED_SELECT,
      orderBy: { dateStart: 'asc' },
      take: DEFAULT_LIST_TAKE,
    });
  }

  buscarPorNombre(nombre: string): Promise<WarSimplified[]> {
    return this.prisma.war.findMany({
      where: { name: { contains: nombre, mode: 'insensitive' } },
      select: SIMPLIFIED_SELECT,
      orderBy: { name: 'asc' },
      take: DEFAULT_LIST_TAKE,
    });
  }

  // Solapamiento de rangos: una guerra "toca" el periodo pedido si su
  // [dateStart, dateEnd] se cruza con [startDate, endDate]. Guerras sin
  // fechas se descartan.
  buscarPorPeriodo(startDate: Date, endDate: Date): Promise<WarSimplified[]> {
    return this.prisma.war.findMany({
      where: {
        AND: [
          { dateStart: { not: null, lte: endDate } },
          { dateEnd: { not: null, gte: startDate } },
        ],
      },
      select: SIMPLIFIED_SELECT,
      orderBy: { dateStart: 'asc' },
    });
  }

  buscarPorId(id: string): Promise<WarWithRelations | null> {
    return this.prisma.war.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: WAR_DETAIL_INCLUDE,
    });
  }
}
