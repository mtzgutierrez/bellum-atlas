import { Injectable, NotFoundException } from '@nestjs/common';
import { CommanderRepository } from './commander.repository';
import { QueryCommanderDto } from './dto/query-commander.dto';
import {
  PaginatedResult,
  buildMeta,
  normalisePagination,
} from '../common/utils/pagination.util';

@Injectable()
export class CommanderService {
  constructor(private readonly commanderRepository: CommanderRepository) {}

  async findAll(dto: QueryCommanderDto): Promise<PaginatedResult<unknown>> {
    const { page, limit, skip, take } = normalisePagination(dto.page, dto.limit);
    const [data, total] = await this.commanderRepository.findAll(dto, skip, take);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string): Promise<unknown> {
    const commander = await this.commanderRepository.findById(id);

    if (!commander) {
      throw new NotFoundException(`Comandante con id "${id}" no encontrado`);
    }

    const battles = commander.battles.map((cbf) => ({
      id: cbf.battleFaction.battle.id,
      name: cbf.battleFaction.battle.name,
      slug: cbf.battleFaction.battle.slug,
      date: cbf.battleFaction.battle.date,
      type: cbf.battleFaction.battle.type,
      personalResult: cbf.battleFaction.result,
      side: cbf.battleFaction.side,
    }));

    const total = battles.length;
    const victories = battles.filter((b) => b.personalResult === 'victory').length;
    const winRate = total > 0 ? Math.round((victories / total) * 100) / 100 : 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { battles: _raw, ...rest } = commander;

    return {
      ...rest,
      battles,
      stats: { total, victories, winRate },
    };
  }
}
