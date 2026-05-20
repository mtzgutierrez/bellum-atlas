import { Injectable, NotFoundException } from '@nestjs/common';
import { Paginated, buildMeta } from '../common/pagination.dto';
import {
  WarFilters,
  WarRepository,
  WarSummary,
  WarWithRelations,
} from './war.repository';

type Page = { page: number; pageSize: number };

@Injectable()
export class WarService {
  constructor(private readonly repo: WarRepository) {}

  async list(filters: WarFilters, p: Page): Promise<Paginated<WarSummary>> {
    const skip = (p.page - 1) * p.pageSize;
    const [data, total] = await Promise.all([
      this.repo.findPaginated(filters, skip, p.pageSize),
      this.repo.count(filters),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async findOne(id: string): Promise<WarWithRelations> {
    const w = await this.repo.findByIdOrSlug(id);
    if (!w) throw new NotFoundException(`Guerra "${id}" no encontrada`);
    return w;
  }
}
