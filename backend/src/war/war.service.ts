import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WarRepository } from './war.repository';
import { QueryWarDto } from './dto/query-war.dto';
import {
  PaginatedResult,
  buildMeta,
  normalisePagination,
} from '../common/utils/pagination.util';

@Injectable()
export class WarService {
  constructor(private readonly warRepository: WarRepository) {}

  async findAll(dto: QueryWarDto): Promise<PaginatedResult<unknown>> {
    const { q } = dto;
    const { page, limit, skip, take } = normalisePagination(dto.page, dto.limit);

    const where: Prisma.WarWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await this.warRepository.findAll(where, skip, take);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(idOrSlug: string): Promise<unknown> {
    const war = await this.warRepository.findByIdOrSlug(idOrSlug);

    if (!war) {
      throw new NotFoundException(`Guerra "${idOrSlug}" no encontrada`);
    }

    const totalBattles = war.battles.length;

    const durationDays =
      war.startDate && war.endDate
        ? Math.floor(
            (war.endDate.getTime() - war.startDate.getTime()) / 86_400_000,
          )
        : null;

    return {
      ...war,
      stats: { totalBattles, durationDays },
    };
  }
}
