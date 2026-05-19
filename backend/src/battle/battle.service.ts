import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Paginated,
  buildMeta,
} from '../common/pagination.dto';
import {
  BattleRepository,
  BattleSimplified,
  BattleWithRelations,
} from './battle.repository';

type Page = { page: number; pageSize: number };

@Injectable()
export class BattleService {
  constructor(private readonly repository: BattleRepository) {}

  async listar(p: Page): Promise<Paginated<BattleSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.listar(slice(p)),
      this.repository.contar(),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorNombre(
    nombre: string,
    p: Page,
  ): Promise<Paginated<BattleSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorNombre(nombre, slice(p)),
      this.repository.contarPorNombre(nombre),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorCoordenadas(
    latitude: number,
    longitude: number,
    radius: number,
    p: Page,
  ): Promise<Paginated<BattleSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorCoordenadas(latitude, longitude, radius, slice(p)),
      this.repository.contarPorCoordenadas(latitude, longitude, radius),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorPeriodo(
    startDate: Date,
    endDate: Date,
    p: Page,
  ): Promise<Paginated<BattleSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorPeriodo(startDate, endDate, slice(p)),
      this.repository.contarPorPeriodo(startDate, endDate),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorGuerra(
    warId: string,
    p: Page,
  ): Promise<Paginated<BattleSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorGuerra(warId, slice(p)),
      this.repository.contarPorGuerra(warId),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorComandante(
    commanderId: string,
    p: Page,
  ): Promise<Paginated<BattleSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorComandante(commanderId, slice(p)),
      this.repository.contarPorComandante(commanderId),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorId(id: string): Promise<BattleWithRelations> {
    const battle = await this.repository.buscarPorId(id);
    if (!battle) throw new NotFoundException(`Batalla ${id} no encontrada`);
    return battle;
  }

  async batallaDelDia(): Promise<BattleWithRelations> {
    const battle = await this.repository.buscarDelDia();
    if (!battle) throw new NotFoundException('Sin batallas disponibles');
    return battle;
  }
}

function slice(p: Page): { skip: number; take: number } {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize };
}
