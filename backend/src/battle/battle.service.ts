import { Injectable, NotFoundException } from '@nestjs/common';
import { fetchArticleText } from '../ai/wikipedia-source';
import { Paginated, buildMeta } from '../common/pagination.dto';
import {
  BattleFilters,
  BattlePoint,
  BattleRepository,
  BattleStats,
  BattleSummary,
  BattleWithRelations,
} from './battle.repository';

export interface BattleArticle {
  article: string | null;
  sourceUrl: string | null;
  cached: boolean;
}

type Page = { page: number; pageSize: number };

@Injectable()
export class BattleService {
  constructor(private readonly repo: BattleRepository) {}

  points(filters: BattleFilters): Promise<BattlePoint[]> {
    return this.repo.findPoints(filters);
  }

  // Efemérides: batallas de un día como hoy. `mmdd` = "-MM-DD".
  onThisDay(mmdd: string): Promise<BattleSummary[]> {
    return this.repo.findOnThisDay(mmdd);
  }

  timeline(limit: number): Promise<BattleSummary[]> {
    return this.repo.findTimeline(limit);
  }

  centuries(): Promise<{ century: number; count: number }[]> {
    return this.repo.findCenturyFacets();
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

  // Artículo completo de Wikipedia con backfill perezoso: si no está cacheado,
  // se trae una vez y se persiste; las siguientes lecturas son instantáneas.
  async getArticle(id: string): Promise<BattleArticle> {
    const src = await this.repo.findArticleSource(id);
    if (!src) throw new NotFoundException(`Batalla "${id}" no encontrada`);
    if (src.article) {
      return { article: src.article, sourceUrl: src.wikipediaUrl, cached: true };
    }
    const text = await fetchArticleText(src.wikipediaUrl, 9000);
    if (text) await this.repo.saveArticle(src.id, text);
    return { article: text, sourceUrl: src.wikipediaUrl, cached: false };
  }

  stats(): Promise<BattleStats> {
    return this.repo.stats();
  }
}
