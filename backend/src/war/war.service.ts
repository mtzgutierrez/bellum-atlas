import { Injectable, NotFoundException } from '@nestjs/common';
import { Paginated, buildMeta } from '../common/pagination.dto';
import {
  WarRepository,
  WarSimplified,
  WarWithRelations,
} from './war.repository';

type Page = { page: number; pageSize: number };

@Injectable()
export class WarService {
  constructor(private readonly repository: WarRepository) {}

  async listar(p: Page): Promise<Paginated<WarSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.listar(slice(p)),
      this.repository.contar(),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorNombre(
    nombre: string,
    p: Page,
  ): Promise<Paginated<WarSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorNombre(nombre, slice(p)),
      this.repository.contarPorNombre(nombre),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorPeriodo(
    startDate: Date,
    endDate: Date,
    p: Page,
  ): Promise<Paginated<WarSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorPeriodo(startDate, endDate, slice(p)),
      this.repository.contarPorPeriodo(startDate, endDate),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorId(id: string): Promise<WarWithRelations> {
    const war = await this.repository.buscarPorId(id);
    if (!war) throw new NotFoundException(`Guerra ${id} no encontrada`);
    return war;
  }
}

function slice(p: Page): { skip: number; take: number } {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize };
}
