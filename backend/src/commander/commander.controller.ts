import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Paginated,
  PaginationQueryDto,
  normalizePagination,
} from '../common/pagination.dto';
import {
  CommanderSimplified,
  CommanderWithRelations,
} from './commander.repository';
import { CommanderService } from './commander.service';
import {
  CommanderBattleRefDto,
  CommanderDto,
  CommanderRankDto,
  CommanderWarRefDto,
  GetCommandersByYearsDto,
  PaginatedCommandersDto,
  SimplifiedCommanderDto,
} from './dto/commander.dto';

type SortBy = 'name' | 'birth';

@ApiTags('Comandantes')
@Controller('commander')
export class CommanderController {
  constructor(private readonly service: CommanderService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comandantes (paginado, máx 50 por página)' })
  @ApiQuery({ name: 'sortBy', enum: ['name', 'birth'], required: false })
  @ApiOkResponse({ type: PaginatedCommandersDto })
  async getAll(
    @Query() q: PaginationQueryDto,
    @Query('sortBy') sortBy?: string,
  ): Promise<PaginatedCommandersDto> {
    return this.mapPage(
      await this.service.listar(this.page(q), this.sort(sortBy)),
    );
  }

  @Get('search/:name')
  @ApiOperation({ summary: 'Buscar comandantes por nombre o alias' })
  @ApiQuery({ name: 'sortBy', enum: ['name', 'birth'], required: false })
  @ApiOkResponse({ type: PaginatedCommandersDto })
  async searchByName(
    @Param('name') name: string,
    @Query() q: PaginationQueryDto,
    @Query('sortBy') sortBy?: string,
  ): Promise<PaginatedCommandersDto> {
    return this.mapPage(
      await this.service.buscarPorNombre(name, this.page(q), this.sort(sortBy)),
    );
  }

  @Get('country/:country')
  @ApiOperation({ summary: 'Buscar comandantes por país (nacionalidad)' })
  @ApiQuery({ name: 'sortBy', enum: ['name', 'birth'], required: false })
  @ApiOkResponse({ type: PaginatedCommandersDto })
  async getByCountry(
    @Param('country') country: string,
    @Query() q: PaginationQueryDto,
    @Query('sortBy') sortBy?: string,
  ): Promise<PaginatedCommandersDto> {
    return this.mapPage(
      await this.service.buscarPorPais(country, this.page(q), this.sort(sortBy)),
    );
  }

  @Post('years')
  @ApiOperation({
    summary:
      'Buscar comandantes vivos en algún momento del rango de años indicado',
  })
  @ApiQuery({ name: 'sortBy', enum: ['name', 'birth'], required: false })
  @ApiOkResponse({ type: PaginatedCommandersDto })
  async getByYears(
    @Body() years: GetCommandersByYearsDto,
    @Query() q: PaginationQueryDto,
    @Query('sortBy') sortBy?: string,
  ): Promise<PaginatedCommandersDto> {
    return this.mapPage(
      await this.service.buscarPorAnios(
        years.startYear,
        years.endYear,
        this.page(q),
        this.sort(sortBy),
      ),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener el detalle de un comandante por id o slug',
  })
  @ApiOkResponse({ type: CommanderDto })
  @ApiNotFoundResponse({ description: 'Comandante no encontrado' })
  async getById(@Param('id') id: string): Promise<CommanderDto> {
    return this.toDto(await this.service.buscarPorId(id));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private page(q: PaginationQueryDto): { page: number; pageSize: number } {
    const { page, pageSize } = normalizePagination(q);
    return { page, pageSize };
  }

  private sort(value: string | undefined): SortBy {
    return value === 'birth' ? 'birth' : 'name';
  }

  private mapPage(
    paged: Paginated<CommanderSimplified>,
  ): PaginatedCommandersDto {
    return {
      data: paged.data.map((c) => this.toSimplifiedDto(c)),
      meta: paged.meta,
    };
  }

  // ── Mappers ─────────────────────────────────────────────────────────────

  private toSimplifiedDto(c: CommanderSimplified): SimplifiedCommanderDto {
    const dto = new SimplifiedCommanderDto();
    dto.id = c.id;
    dto.name = c.name;
    dto.slug = c.slug;
    dto.birthDate = c.birthDate;
    dto.deathDate = c.deathDate;
    dto.nationality = c.nationality;
    dto.imageUrl = c.imageUrl;
    dto.wikipediaUrl = c.wikipediaUrl;
    return dto;
  }

  private toDto(c: CommanderWithRelations): CommanderDto {
    const dto = new CommanderDto();
    dto.id = c.id;
    dto.name = c.name;
    dto.slug = c.slug;
    dto.description = c.description;
    dto.summary = c.summary;
    dto.aliases = c.aliases;
    dto.birthDate = c.birthDate;
    dto.birthPlace = c.birthPlace;
    dto.deathDate = c.deathDate;
    dto.deathPlace = c.deathPlace;
    dto.causeOfDeath = c.causeOfDeath;
    dto.nationality = c.nationality;
    dto.imageUrl = c.imageUrl;
    dto.wikipediaUrl = c.wikipediaUrl;

    dto.ranks = c.ranks.map((r) => {
      const rk = new CommanderRankDto();
      rk.id = r.id;
      rk.name = r.name;
      rk.wikidataId = r.wikidataId;
      rk.dateStart = r.dateStart;
      rk.dateEnd = r.dateEnd;
      return rk;
    });

    dto.wars = c.wars.map((cw) => {
      const w = new CommanderWarRefDto();
      w.id = cw.war.id;
      w.name = cw.war.name;
      w.slug = cw.war.slug;
      return w;
    });

    dto.battles = c.battleFactions.map((bfc) => {
      const b = new CommanderBattleRefDto();
      b.id = bfc.battleFaction.battle.id;
      b.name = bfc.battleFaction.battle.name;
      b.slug = bfc.battleFaction.battle.slug;
      b.date = bfc.battleFaction.battle.date;
      b.factionName = bfc.battleFaction.faction.name;
      return b;
    });

    return dto;
  }
}
