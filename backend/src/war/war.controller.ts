import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { normalizePagination } from '../common/pagination.dto';
import { WarFilters, WarWithRelations } from './war.repository';
import { WarService } from './war.service';
import {
  PaginatedWarsDto,
  WarBattleRefDto,
  WarDto,
  WarSummaryDto,
  WarsQueryDto,
} from './dto/war.dto';

@ApiTags('Guerras')
@Controller('wars')
export class WarController {
  constructor(private readonly service: WarService) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de guerras.' })
  @ApiOkResponse({ type: PaginatedWarsDto })
  async list(@Query() q: WarsQueryDto): Promise<PaginatedWarsDto> {
    const filters = parseFilters(q);
    const { page, pageSize } = normalizePagination(q);
    const result = await this.service.list(filters, { page, pageSize });
    return {
      data: result.data.map(
        (w): WarSummaryDto => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          startYear: w.startYear,
          endYear: w.endYear,
          imageUrl: w.imageUrl,
          region: w.region,
        }),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de guerra por id o slug.' })
  @ApiOkResponse({ type: WarDto })
  @ApiNotFoundResponse({ description: 'Guerra no encontrada' })
  async detail(@Param('id') id: string): Promise<WarDto> {
    return toDto(await this.service.findOne(id));
  }
}

function parseFilters(q: WarsQueryDto): WarFilters {
  const num = (s: string | undefined) =>
    s !== undefined && Number.isFinite(Number(s)) ? Number(s) : undefined;
  return {
    search: q.search,
    yearMin: num(q.yearMin),
    yearMax: num(q.yearMax),
  };
}

function toDto(w: WarWithRelations): WarDto {
  return {
    id: w.id,
    name: w.name,
    slug: w.slug,
    startYear: w.startYear,
    endYear: w.endYear,
    imageUrl: w.imageUrl,
    region: w.region,
    summary: w.summary,
    wikipediaUrl: w.wikipediaUrl,
    battles: w.battles.map(
      (bw): WarBattleRefDto => ({
        id: bw.battle.id,
        name: bw.battle.name,
        slug: bw.battle.slug,
        year: bw.battle.year,
        latitude: bw.battle.latitude,
        longitude: bw.battle.longitude,
      }),
    ),
  };
}
