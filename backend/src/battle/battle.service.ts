import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BattleRepository,
  BattleSimplified,
  BattleWithRelations,
} from './battle.repository';

@Injectable()
export class BattleService {
  constructor(private readonly repository: BattleRepository) {}

  // ── Consultas ────────────────────────────────────────────────────────────

  listar(): Promise<BattleSimplified[]> {
    return this.repository.listar();
  }

  buscarPorNombre(nombre: string): Promise<BattleSimplified[]> {
    return this.repository.buscarPorNombre(nombre);
  }

  buscarPorCoordenadas(
    latitude: number,
    longitude: number,
    radius: number,
  ): Promise<BattleSimplified[]> {
    return this.repository.buscarPorCoordenadas(latitude, longitude, radius);
  }

  buscarPorPeriodo(
    startDate: Date,
    endDate: Date,
  ): Promise<BattleSimplified[]> {
    return this.repository.buscarPorPeriodo(startDate, endDate);
  }

  buscarPorGuerra(warId: string): Promise<BattleSimplified[]> {
    return this.repository.buscarPorGuerra(warId);
  }

  buscarPorComandante(commanderId: string): Promise<BattleSimplified[]> {
    return this.repository.buscarPorComandante(commanderId);
  }

  async buscarPorId(id: string): Promise<BattleWithRelations> {
    const battle = await this.repository.buscarPorId(id);
    if (!battle) throw new NotFoundException(`Batalla ${id} no encontrada`);
    return battle;
  }
}
