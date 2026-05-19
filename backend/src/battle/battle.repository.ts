import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const BATTLE_DETAIL_INCLUDE = {
  wars: {
    include: {
      war: { select: { id: true, name: true, slug: true } },
    },
  },
  factions: {
    orderBy: { side: 'asc' as const },
    include: {
      faction: {
        select: { id: true, name: true, slug: true, flagUrl: true },
      },
      commanders: {
        include: {
          commander: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
  media: true,
} satisfies Prisma.BattleInclude;

export type BattleWithRelations = Prisma.BattleGetPayload<{
  include: typeof BATTLE_DETAIL_INCLUDE;
}>;

const SIMPLIFIED_SELECT = {
  id: true,
  name: true,
  slug: true,
  date: true,
  dateStart: true,
  dateEnd: true,
  locationName: true,
  country: true,
  imageUrl: true,
  wikipediaUrl: true,
} satisfies Prisma.BattleSelect;

export type BattleSimplified = Prisma.BattleGetPayload<{
  select: typeof SIMPLIFIED_SELECT;
}>;

const DEFAULT_LIST_TAKE = 100;

@Injectable()
export class BattleRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
      take: DEFAULT_LIST_TAKE,
    });
  }

  buscarPorNombre(nombre: string): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: { name: { contains: nombre, mode: 'insensitive' } },
      select: SIMPLIFIED_SELECT,
      orderBy: { name: 'asc' },
      take: DEFAULT_LIST_TAKE,
    });
  }

  // Bounding box aproximada: 1° lat ≈ 111 km; 1° lng ≈ 111·cos(lat) km.
  // Suficiente para filtros visuales en mapa; para precisión exacta usar
  // PostGIS o earthdistance.
  buscarPorCoordenadas(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<BattleSimplified[]> {
    const dLat = radiusKm / 111;
    const cos = Math.cos((lat * Math.PI) / 180);
    const dLng = cos === 0 ? 180 : radiusKm / (111 * Math.abs(cos));
    return this.prisma.battle.findMany({
      where: {
        lat: { gte: lat - dLat, lte: lat + dLat },
        lng: { gte: lng - dLng, lte: lng + dLng },
      },
      select: SIMPLIFIED_SELECT,
      orderBy: { date: 'asc' },
    });
  }

  // Solapamiento: incluye batallas de un día dentro del rango y batallas
  // con duración (dateStart..dateEnd) que se cruzan con el rango pedido.
  buscarPorPeriodo(
    startDate: Date,
    endDate: Date,
  ): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: {
        OR: [
          { date: { gte: startDate, lte: endDate } },
          {
            AND: [
              { dateStart: { lte: endDate } },
              { dateEnd: { gte: startDate } },
            ],
          },
        ],
      },
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
    });
  }

  buscarPorGuerra(warId: string): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: { wars: { some: { warId } } },
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
    });
  }

  buscarPorComandante(commanderId: string): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: {
        factions: {
          some: {
            commanders: { some: { commanderId } },
          },
        },
      },
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
    });
  }

  // Acepta id o slug para soportar URLs amigables.
  buscarPorId(id: string): Promise<BattleWithRelations | null> {
    return this.prisma.battle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: BATTLE_DETAIL_INCLUDE,
    });
  }
}
