import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CommanderRepository,
  CommanderSimplified,
  CommanderWithRelations,
} from './commander.repository';

@Injectable()
export class CommanderService {
  constructor(private readonly repository: CommanderRepository) {}

  listar(): Promise<CommanderSimplified[]> {
    return this.repository.listar();
  }

  buscarPorNombre(nombre: string): Promise<CommanderSimplified[]> {
    return this.repository.buscarPorNombre(nombre);
  }

  buscarPorPais(pais: string): Promise<CommanderSimplified[]> {
    return this.repository.buscarPorPais(pais);
  }

  buscarPorAnios(
    startYear: number,
    endYear: number,
  ): Promise<CommanderSimplified[]> {
    if (
      !Number.isFinite(startYear) ||
      !Number.isFinite(endYear) ||
      startYear > endYear
    ) {
      throw new BadRequestException(
        'Rango de años inválido: startYear debe ser ≤ endYear',
      );
    }
    return this.repository.buscarPorAnios(startYear, endYear);
  }

  async buscarPorId(id: string): Promise<CommanderWithRelations> {
    const commander = await this.repository.buscarPorId(id);
    if (!commander)
      throw new NotFoundException(`Comandante ${id} no encontrado`);
    return commander;
  }
}
