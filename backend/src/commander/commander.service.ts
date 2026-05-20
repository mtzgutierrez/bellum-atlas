import { Injectable, NotFoundException } from '@nestjs/common';
import { Paginated, buildMeta } from '../common/pagination.dto';
import {
  CommanderRepository,
  CommanderSummary,
  CommanderWithRelations,
} from './commander.repository';

type Page = { page: number; pageSize: number };

@Injectable()
export class CommanderService {
  constructor(private readonly repo: CommanderRepository) {}

  async list(search: string | undefined, p: Page): Promise<Paginated<CommanderSummary>> {
    const skip = (p.page - 1) * p.pageSize;
    const [data, total] = await Promise.all([
      this.repo.findPaginated(search, skip, p.pageSize),
      this.repo.count(search),
    ]);
    return { data, meta: buildMeta(total, p.page, p.pageSize) };
  }

  async findOne(id: string): Promise<CommanderWithRelations> {
    const c = await this.repo.findByIdOrSlug(id);
    if (!c) throw new NotFoundException(`Comandante "${id}" no encontrado`);
    return c;
  }
}
