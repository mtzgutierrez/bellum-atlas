import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  SimplifiedBattleDto,
} from './dto/battle.dto';

@ApiTags('Batallas')
@Controller('battle')
export class BattleController {
  constructor(private readonly service: BattleService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las batallas (vista simplificada)' })
  @ApiOkResponse({ type: [SimplifiedBattleDto] })
  async getAll(): Promise<SimplifiedBattleDto[]> {
    const batallas = await this.service.listar();
    return batallas.map((b) => this.toSimplifiedDto(b));
  }

  // ── Búsqueda y filtros ──────────────────────────────────────────────────

  @Get('search/:name')
  @ApiOperation({ summary: 'Buscar batallas por nombre' })
  @ApiOkResponse({ type: [SimplifiedBattleDto] })
  async searchByName(
    @Param('name') name: string,
  ): Promise<SimplifiedBattleDto[]> {
    const batallas = await this.service.buscarPorNombre(name);
    return batallas.map((b) => this.toSimplifiedDto(b));
  }

  @Post('coordinates')
  @ApiOperation({
    summary: 'Buscar batallas dentro de un radio en torno a unas coordenadas',
  })
  @ApiOkResponse({ type: [SimplifiedBattleDto] })
  async getByCoordinates(
    @Body() coordinates: GetBattlesByCoordinatesDto,
  ): Promise<SimplifiedBattleDto[]> {
    const batallas = await this.service.buscarPorCoordenadas(
      coordinates.latitude,
      coordinates.longitude,
      coordinates.radius,
    );
    return batallas.map((b) => this.toSimplifiedDto(b));
  }

  @Post('time-period')
  @ApiOperation({ summary: 'Buscar batallas en un periodo de tiempo' })
  @ApiOkResponse({ type: [SimplifiedBattleDto] })
  async getByTimePeriod(
    @Body() timePeriod: GetBattlesByTimePeriodDto,
  ): Promise<SimplifiedBattleDto[]> {
    const batallas = await this.service.buscarPorPeriodo(
      new Date(timePeriod.startDate),
      new Date(timePeriod.endDate),
    );
    return batallas.map((b) => this.toSimplifiedDto(b));
  }

  // ── Entidades relacionadas ──────────────────────────────────────────────

  @Get('war/:warId')
  @ApiOperation({ summary: 'Listar batallas de una guerra' })
  @ApiOkResponse({ type: [SimplifiedBattleDto] })
  async getByWarId(
    @Param('warId') warId: string,
  ): Promise<SimplifiedBattleDto[]> {
    const batallas = await this.service.buscarPorGuerra(warId);
    return batallas.map((b) => this.toSimplifiedDto(b));
  }

  @Get('commander/:commanderId')
  @ApiOperation({ summary: 'Listar batallas en las que participó un comandante' })
  @ApiOkResponse({ type: [SimplifiedBattleDto] })
  async getByCommanderId(
    @Param('commanderId') commanderId: string,
  ): Promise<SimplifiedBattleDto[]> {
    const batallas = await this.service.buscarPorComandante(commanderId);
    return batallas.map((b) => this.toSimplifiedDto(b));
  }

  // ── Detalle ─────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una batalla por id o slug' })
  @ApiOkResponse({ type: BattleDto })
  @ApiNotFoundResponse({ description: 'Batalla no encontrada' })
  async getById(@Param('id') id: string): Promise<BattleDto> {
    const batalla = await this.service.buscarPorId(id);
    return this.toDto(batalla);
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
