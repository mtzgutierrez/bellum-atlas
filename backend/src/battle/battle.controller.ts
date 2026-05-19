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
  BattleSimplified,
  BattleWithRelations,
} from './battle.repository';
import { BattleService } from './battle.service';
import {
  BattleDto,
  BattleFactionDto,
  BattleMediaDto,
  BattleWarRefDto,
  GetBattlesByCoordinatesDto,
  GetBattlesByTimePeriodDto,
  PaginatedBattlesDto,
  SimplifiedBattleDto,
} from './dto/battle.dto';

@ApiTags('Batallas')
@Controller('battle')
export class BattleController {
  constructor(private readonly service: BattleService) {}

  @Get()
  @ApiOperation({ summary: 'Listar batallas (paginado, máx 50 por página)' })
  @ApiOkResponse({ type: PaginatedBattlesDto })
  async getAll(@Query() q: PaginationQueryDto): Promise<PaginatedBattlesDto> {
    return this.mapPage(await this.service.listar(this.page(q)));
  }

  @Get('search/:name')
  @ApiOperation({ summary: 'Buscar batallas por nombre (paginado)' })
  @ApiOkResponse({ type: PaginatedBattlesDto })
  async searchByName(
    @Param('name') name: string,
    @Query() q: PaginationQueryDto,
  ): Promise<PaginatedBattlesDto> {
    return this.mapPage(await this.service.buscarPorNombre(name, this.page(q)));
  }

  @Post('coordinates')
  @ApiOperation({
    summary: 'Buscar batallas dentro de un radio en torno a unas coordenadas',
  })
  @ApiOkResponse({ type: PaginatedBattlesDto })
  async getByCoordinates(
    @Body() coordinates: GetBattlesByCoordinatesDto,
    @Query() q: PaginationQueryDto,
  ): Promise<PaginatedBattlesDto> {
    return this.mapPage(
      await this.service.buscarPorCoordenadas(
        coordinates.latitude,
        coordinates.longitude,
        coordinates.radius,
        this.page(q),
      ),
    );
  }

  @Post('time-period')
  @ApiOperation({ summary: 'Buscar batallas en un periodo de tiempo' })
  @ApiOkResponse({ type: PaginatedBattlesDto })
  async getByTimePeriod(
    @Body() timePeriod: GetBattlesByTimePeriodDto,
    @Query() q: PaginationQueryDto,
  ): Promise<PaginatedBattlesDto> {
    return this.mapPage(
      await this.service.buscarPorPeriodo(
        new Date(timePeriod.startDate),
        new Date(timePeriod.endDate),
        this.page(q),
      ),
    );
  }

  @Get('war/:warId')
  @ApiOperation({ summary: 'Listar batallas de una guerra (paginado)' })
  @ApiOkResponse({ type: PaginatedBattlesDto })
  async getByWarId(
    @Param('warId') warId: string,
    @Query() q: PaginationQueryDto,
  ): Promise<PaginatedBattlesDto> {
    return this.mapPage(await this.service.buscarPorGuerra(warId, this.page(q)));
  }

  @Get('commander/:commanderId')
  @ApiOperation({
    summary: 'Listar batallas en las que participó un comandante (paginado)',
  })
  @ApiOkResponse({ type: PaginatedBattlesDto })
  async getByCommanderId(
    @Param('commanderId') commanderId: string,
    @Query() q: PaginationQueryDto,
  ): Promise<PaginatedBattlesDto> {
    return this.mapPage(
      await this.service.buscarPorComandante(commanderId, this.page(q)),
    );
  }

  @Get('random')
  @ApiOperation({
    summary: 'Batalla del día (estable durante 24h, sirve como presentación)',
  })
  @ApiOkResponse({ type: BattleDto })
  async getRandom(): Promise<BattleDto> {
    return this.toDto(await this.service.batallaDelDia());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una batalla por id o slug' })
  @ApiOkResponse({ type: BattleDto })
  @ApiNotFoundResponse({ description: 'Batalla no encontrada' })
  async getById(@Param('id') id: string): Promise<BattleDto> {
    return this.toDto(await this.service.buscarPorId(id));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private page(q: PaginationQueryDto): { page: number; pageSize: number } {
    const { page, pageSize } = normalizePagination(q);
    return { page, pageSize };
  }

  private mapPage(
    paged: Paginated<BattleSimplified>,
  ): PaginatedBattlesDto {
    return {
      data: paged.data.map((b) => this.toSimplifiedDto(b)),
      meta: paged.meta,
    };
  }

  // ── Mappers ─────────────────────────────────────────────────────────────

  private toSimplifiedDto(b: BattleSimplified): SimplifiedBattleDto {
    const dto = new SimplifiedBattleDto();
    dto.id = b.id;
    dto.name = b.name;
    dto.slug = b.slug;
    dto.date = b.date;
    dto.dateStart = b.dateStart;
    dto.dateEnd = b.dateEnd;
    dto.locationName = b.locationName;
    dto.country = b.country;
    dto.latitude = b.lat;
    dto.longitude = b.lng;
    dto.type = b.type;
    dto.imageUrl = b.imageUrl;
    dto.wikipediaUrl = b.wikipediaUrl;
    return dto;
  }

  private toDto(b: BattleWithRelations): BattleDto {
    const dto = new BattleDto();
    dto.id = b.id;
    dto.name = b.name;
    dto.slug = b.slug;
    dto.description = b.description;
    dto.summary = b.summary;
    dto.date = b.date;
    dto.dateStart = b.dateStart;
    dto.dateEnd = b.dateEnd;
    dto.locationName = b.locationName;
    dto.country = b.country;
    dto.latitude = b.lat;
    dto.longitude = b.lng;
    dto.deaths = b.deaths;
    dto.casualties = b.casualties;
    dto.imageUrl = b.imageUrl;
    dto.mapImageUrl = b.mapImageUrl;
    dto.wikipediaUrl = b.wikipediaUrl;
    dto.type = b.type;

    dto.wars = b.wars.map((bw) => {
      const w = new BattleWarRefDto();
      w.id = bw.war.id;
      w.name = bw.war.name;
      w.slug = bw.war.slug;
      return w;
    });

    dto.factions = b.factions.map((bf) => {
      const f = new BattleFactionDto();
      f.id = bf.faction.id;
      f.name = bf.faction.name;
      f.slug = bf.faction.slug;
      f.flagUrl = bf.faction.flagUrl;
      f.side = bf.side;
      f.outcome = bf.outcome;
      f.strength = bf.strength;
      f.deaths = bf.deaths;
      f.injured = bf.injured;
      f.commanders = bf.commanders.map((bfc) => ({
        id: bfc.commander.id,
        name: bfc.commander.name,
        slug: bfc.commander.slug,
      }));
      return f;
    });

    dto.media = b.media.map((m) => {
      const md = new BattleMediaDto();
      md.id = m.id;
      md.url = m.url;
      md.type = m.type;
      md.caption = m.caption;
      return md;
    });

    return dto;
  }
}
