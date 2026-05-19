import { Injectable, NotFoundException } from '@nestjs/common';
import {
  WarRepository,
  WarSimplified,
  WarWithRelations,
} from './war.repository';

@Injectable()
export class WarService {
  constructor(private readonly repository: WarRepository) {}

  listar(): Promise<WarSimplified[]> {
    return this.repository.listar();
  }

  buscarPorNombre(nombre: string): Promise<WarSimplified[]> {
    return this.repository.buscarPorNombre(nombre);
  }

  buscarPorPeriodo(
    startDate: Date,
    endDate: Date,
  ): Promise<WarSimplified[]> {
    return this.repository.buscarPorPeriodo(startDate, endDate);
  }

  async buscarPorId(id: string): Promise<WarWithRelations> {
    const war = await this.repository.buscarPorId(id);
    if (!war) throw new NotFoundException(`Guerra ${id} no encontrada`);
    return war;
  }
}
