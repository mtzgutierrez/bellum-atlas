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
  lat: true,
  lng: true,
  type: true,
  imageUrl: true,
  wikipediaUrl: true,
} satisfies Prisma.BattleSelect;

export type BattleSimplified = Prisma.BattleGetPayload<{
  select: typeof SIMPLIFIED_SELECT;
}>;

type Page = { skip: number; take: number };

@Injectable()
export class BattleRepository {
  constructor(private readonly prisma: PrismaService) {}

  contar(where: Prisma.BattleWhereInput = {}): Promise<number> {
    return this.prisma.battle.count({ where });
  }

  listar(page: Page): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
      ...page,
    });
  }

  buscarPorNombre(nombre: string, page: Page): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: this.whereNombre(nombre),
      select: SIMPLIFIED_SELECT,
      orderBy: { name: 'asc' },
      ...page,
    });
  }

  contarPorNombre(nombre: string): Promise<number> {
    return this.prisma.battle.count({ where: this.whereNombre(nombre) });
  }

  // Bounding box aproximada: 1° lat ≈ 111 km; 1° lng ≈ 111·cos(lat) km.
  buscarPorCoordenadas(
    lat: number,
    lng: number,
    radiusKm: number,
    page: Page,
  ): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: this.whereCoordenadas(lat, lng, radiusKm),
      select: SIMPLIFIED_SELECT,
      orderBy: { date: 'asc' },
      ...page,
    });
  }

  contarPorCoordenadas(lat: number, lng: number, radiusKm: number): Promise<number> {
    return this.prisma.battle.count({
      where: this.whereCoordenadas(lat, lng, radiusKm),
    });
  }

  buscarPorPeriodo(
    startDate: Date,
    endDate: Date,
    page: Page,
  ): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: this.wherePeriodo(startDate, endDate),
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
      ...page,
    });
  }

  contarPorPeriodo(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.battle.count({ where: this.wherePeriodo(startDate, endDate) });
  }

  buscarPorGuerra(warId: string, page: Page): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: { wars: { some: { warId } } },
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
      ...page,
    });
  }

  contarPorGuerra(warId: string): Promise<number> {
    return this.prisma.battle.count({ where: { wars: { some: { warId } } } });
  }

  buscarPorComandante(commanderId: string, page: Page): Promise<BattleSimplified[]> {
    return this.prisma.battle.findMany({
      where: this.whereComandante(commanderId),
      select: SIMPLIFIED_SELECT,
      orderBy: [{ date: 'asc' }, { dateStart: 'asc' }],
      ...page,
    });
  }

  contarPorComandante(commanderId: string): Promise<number> {
    return this.prisma.battle.count({ where: this.whereComandante(commanderId) });
  }

  // ── Where helpers (privados, evitan duplicar filtros entre listar y contar) ──

  private whereNombre(nombre: string): Prisma.BattleWhereInput {
    return { name: { contains: nombre, mode: 'insensitive' } };
  }

  private whereCoordenadas(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Prisma.BattleWhereInput {
    const dLat = radiusKm / 111;
    const cos = Math.cos((lat * Math.PI) / 180);
    const dLng = cos === 0 ? 180 : radiusKm / (111 * Math.abs(cos));
    return {
      lat: { gte: lat - dLat, lte: lat + dLat },
      lng: { gte: lng - dLng, lte: lng + dLng },
    };
  }

  private wherePeriodo(startDate: Date, endDate: Date): Prisma.BattleWhereInput {
    return {
      OR: [
        { date: { gte: startDate, lte: endDate } },
        {
          AND: [
            { dateStart: { lte: endDate } },
            { dateEnd: { gte: startDate } },
          ],
        },
      ],
    };
  }

  private whereComandante(commanderId: string): Prisma.BattleWhereInput {
    return {
      factions: {
        some: {
          commanders: { some: { commanderId } },
        },
      },
    };
  }

  // Acepta id o slug para soportar URLs amigables.
  buscarPorId(id: string): Promise<BattleWithRelations | null> {
    return this.prisma.battle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: BATTLE_DETAIL_INCLUDE,
    });
  }

  // "Batalla del día": elegida de forma determinista a partir del día actual,
  // de manera que todas las peticiones del mismo día devuelven la misma.
  // Filtra por batallas con imagen y fecha para que la portada se vea bien.
  async buscarDelDia(): Promise<BattleWithRelations | null> {
    const candidates = await this.prisma.battle.findMany({
      where: {
        date: { not: null },
        imageUrl: { not: null },
      },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (candidates.length === 0) return null;

    const epochDay = Math.floor(Date.now() / 86_400_000);
    const picked = candidates[epochDay % candidates.length];
    return this.prisma.battle.findUnique({
      where: { id: picked.id },
      include: BATTLE_DETAIL_INCLUDE,
    });
  }
}
