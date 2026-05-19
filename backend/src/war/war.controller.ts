import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Paginated,
  PaginationQueryDto,
  normalizePagination,
} from '../common/pagination.dto';
import {
  WarSimplified,
  WarWithRelations,
} from './war.repository';
import { WarService } from './war.service';
import {
  GetWarsByTimePeriodDto,
  PaginatedWarsDto,
  SimplifiedWarDto,
  WarBattleRefDto,
  WarCommanderRefDto,
  WarDto,
  WarFactionDto,
} from './dto/war.dto';

@ApiTags('Guerras')
@Controller('war')
export class WarController {
  constructor(private readonly service: WarService) {}

  @Get()
  @ApiOperation({ summary: 'Listar guerras (paginado, máx 50 por página)' })
  @ApiOkResponse({ type: PaginatedWarsDto })
  async getAll(@Query() q: PaginationQueryDto): Promise<PaginatedWarsDto> {
    return this.mapPage(await this.service.listar(this.page(q)));
  }

  @Get('search/:name')
  @ApiOperation({ summary: 'Buscar guerras por nombre (paginado)' })
  @ApiOkResponse({ type: PaginatedWarsDto })
  async searchByName(
    @Param('name') name: string,
    @Query() q: PaginationQueryDto,
  ): Promise<PaginatedWarsDto> {
    return this.mapPage(await this.service.buscarPorNombre(name, this.page(q)));
  }

  @Post('time-period')
  @ApiOperation({ summary: 'Buscar guerras en un periodo de tiempo' })
  @ApiOkResponse({ type: PaginatedWarsDto })
  async getByTimePeriod(
    @Body() timePeriod: GetWarsByTimePeriodDto,
    @Query() q: PaginationQueryDto,
  ): Promise<PaginatedWarsDto> {
    return this.mapPage(
      await this.service.buscarPorPeriodo(
        new Date(timePeriod.startDate),
        new Date(timePeriod.endDate),
        this.page(q),
      ),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una guerra por id o slug' })
  @ApiOkResponse({ type: WarDto })
  @ApiNotFoundResponse({ description: 'Guerra no encontrada' })
  async getById(@Param('id') id: string): Promise<WarDto> {
    return this.toDto(await this.service.buscarPorId(id));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private page(q: PaginationQueryDto): { page: number; pageSize: number } {
    const { page, pageSize } = normalizePagination(q);
    return { page, pageSize };
  }

  private mapPage(paged: Paginated<WarSimplified>): PaginatedWarsDto {
    return {
      data: paged.data.map((w) => this.toSimplifiedDto(w)),
      meta: paged.meta,
    };
  }

  // ── Mappers ─────────────────────────────────────────────────────────────

  private toSimplifiedDto(w: WarSimplified): SimplifiedWarDto {
    const dto = new SimplifiedWarDto();
    dto.id = w.id;
    dto.name = w.name;
    dto.slug = w.slug;
    dto.dateStart = w.dateStart;
    dto.dateEnd = w.dateEnd;
    dto.imageUrl = w.imageUrl;
    dto.wikipediaUrl = w.wikipediaUrl;
    return dto;
  }

  private toDto(w: WarWithRelations): WarDto {
    const dto = new WarDto();
    dto.id = w.id;
    dto.name = w.name;
    dto.slug = w.slug;
    dto.description = w.description;
    dto.summary = w.summary;
    dto.dateStart = w.dateStart;
    dto.dateEnd = w.dateEnd;
    dto.locations = w.locations;
    dto.deaths = w.deaths;
    dto.imageUrl = w.imageUrl;
    dto.wikipediaUrl = w.wikipediaUrl;

    dto.battles = w.battles.map((bw) => {
      const b = new WarBattleRefDto();
      b.id = bw.battle.id;
      b.name = bw.battle.name;
      b.slug = bw.battle.slug;
      b.date = bw.battle.date;
      b.dateStart = bw.battle.dateStart;
      b.dateEnd = bw.battle.dateEnd;
      return b;
    });

    dto.factions = w.factions.map((wf) => {
      const f = new WarFactionDto();
      f.id = wf.faction.id;
      f.name = wf.faction.name;
      f.slug = wf.faction.slug;
      f.flagUrl = wf.faction.flagUrl;
      f.side = wf.side;
      f.outcome = wf.outcome;
      f.strength = wf.strength;
      f.deaths = wf.deaths;
      f.injured = wf.injured;
      return f;
    });

    dto.commanders = w.commanders.map((cw) => {
      const c = new WarCommanderRefDto();
      c.id = cw.commander.id;
      c.name = cw.commander.name;
      c.slug = cw.commander.slug;
      return c;
    });

    return dto;
  }
}
