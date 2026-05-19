import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Paginated, buildMeta } from '../common/pagination.dto';
import {
  CommanderRepository,
  CommanderSimplified,
  CommanderWithRelations,
} from './commander.repository';

type Page = { page: number; pageSize: number };
type SortBy = 'name' | 'birth';

@Injectable()
export class CommanderService {
  constructor(private readonly repository: CommanderRepository) {}

  async listar(p: Page, sortBy: SortBy): Promise<Paginated<CommanderSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.listar(slice(p), sortBy),
      this.repository.contar(),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorNombre(
    nombre: string,
    p: Page,
    sortBy: SortBy,
  ): Promise<Paginated<CommanderSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorNombre(nombre, slice(p), sortBy),
      this.repository.contarPorNombre(nombre),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorPais(
    pais: string,
    p: Page,
    sortBy: SortBy,
  ): Promise<Paginated<CommanderSimplified>> {
    const [data, total] = await Promise.all([
      this.repository.buscarPorPais(pais, slice(p), sortBy),
      this.repository.contarPorPais(pais),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorAnios(
    startYear: number,
    endYear: number,
    p: Page,
    sortBy: SortBy,
  ): Promise<Paginated<CommanderSimplified>> {
    if (
      !Number.isFinite(startYear) ||
      !Number.isFinite(endYear) ||
      startYear > endYear
    ) {
      throw new BadRequestException(
        'Rango de años inválido: startYear debe ser ≤ endYear',
      );
    }
    const [data, total] = await Promise.all([
      this.repository.buscarPorAnios(startYear, endYear, slice(p), sortBy),
      this.repository.contarPorAnios(startYear, endYear),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async buscarPorId(id: string): Promise<CommanderWithRelations> {
    const commander = await this.repository.buscarPorId(id);
    if (!commander)
      throw new NotFoundException(`Comandante ${id} no encontrado`);
    return commander;
  }
}

function slice(p: Page): { skip: number; take: number } {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize };
}
