import { Injectable, NotFoundException } from '@nestjs/common';
import { Paginated, buildMeta } from '../common/pagination.dto';
import {
  BattleFilters,
  BattlePoint,
  BattleRepository,
  BattleSummary,
  BattleWithRelations,
} from './battle.repository';

type Page = { page: number; pageSize: number };

@Injectable()
export class BattleService {
  constructor(private readonly repo: BattleRepository) {}

  points(filters: BattleFilters): Promise<BattlePoint[]> {
    return this.repo.findPoints(filters);
  }

  async list(
    filters: BattleFilters,
    p: Page,
  ): Promise<Paginated<BattleSummary>> {
    const skip = (p.page - 1) * p.pageSize;
    const [data, total] = await Promise.all([
      this.repo.findPaginated(filters, skip, p.pageSize),
      this.repo.count(filters),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async findOne(id: string): Promise<BattleWithRelations> {
    const battle = await this.repo.findByIdOrSlug(id);
    if (!battle) throw new NotFoundException(`Batalla "${id}" no encontrada`);
    return battle;
  }
}
