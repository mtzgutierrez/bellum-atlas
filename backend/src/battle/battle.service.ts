import { Injectable, NotFoundException } from '@nestjs/common';
import { BattleRepository } from './battle.repository';
import { QueryBattleDto } from './dto/query-battle.dto';
import {
  PaginatedResult,
  buildMeta,
  normalisePagination,
} from '../common/utils/pagination.util';

@Injectable()
export class BattleService {
  constructor(private readonly battleRepository: BattleRepository) {}

  async findAll(dto: QueryBattleDto): Promise<PaginatedResult<unknown>> {
    const { page, limit, skip, take } = normalisePagination(dto.page, dto.limit);
    const [data, total] = await this.battleRepository.findAll(dto, skip, take);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(idOrSlug: string): Promise<unknown> {
    const battle = await this.battleRepository.findByIdOrSlug(idOrSlug);

    if (!battle) {
      throw new NotFoundException(`Batalla "${idOrSlug}" no encontrada`);
    }

    const warIds = battle.wars.map((bw) => bw.warId);
    const relatedBattles = warIds.length
      ? await this.battleRepository.findRelated(warIds, battle.id)
      : [];

    return { ...battle, relatedBattles };
  }
}
