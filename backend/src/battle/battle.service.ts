import { Injectable, NotFoundException } from '@nestjs/common';
import { BattleType, Prisma } from '@prisma/client';
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
    const { q, era, result, type, country, sortBy = 'date' } = dto;
    const { page, limit, skip, take } = normalisePagination(dto.page, dto.limit);

    const where: Prisma.BattleWhereInput = {
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { wars: { some: { war: { name: { contains: q, mode: 'insensitive' } } } } },
          { location: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
      ...(era && { era: { slug: era } }),
      ...(result && { result }),
      ...(type && { type: type as BattleType }),
      ...(country && {
        location: { country: { contains: country, mode: 'insensitive' } },
      }),
    };

    const orderBy: Prisma.BattleOrderByWithRelationInput =
      sortBy === 'name' ? { name: 'asc' } : { date: 'asc' };

    const [data, total] = await this.battleRepository.findAll(where, orderBy, skip, take);

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
