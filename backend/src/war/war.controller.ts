import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  WarSimplified,
  WarWithRelations,
} from './war.repository';
import { WarService } from './war.service';
import {
  GetWarsByTimePeriodDto,
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
  @ApiOperation({ summary: 'Listar guerras (vista simplificada)' })
  @ApiOkResponse({ type: [SimplifiedWarDto] })
  async getAll(): Promise<SimplifiedWarDto[]> {
    const guerras = await this.service.listar();
    return guerras.map((w) => this.toSimplifiedDto(w));
  }

  @Get('search/:name')
  @ApiOperation({ summary: 'Buscar guerras por nombre' })
  @ApiOkResponse({ type: [SimplifiedWarDto] })
  async searchByName(
    @Param('name') name: string,
  ): Promise<SimplifiedWarDto[]> {
    const guerras = await this.service.buscarPorNombre(name);
    return guerras.map((w) => this.toSimplifiedDto(w));
  }

  @Post('time-period')
  @ApiOperation({ summary: 'Buscar guerras en un periodo de tiempo' })
  @ApiOkResponse({ type: [SimplifiedWarDto] })
  async getByTimePeriod(
    @Body() timePeriod: GetWarsByTimePeriodDto,
  ): Promise<SimplifiedWarDto[]> {
    const guerras = await this.service.buscarPorPeriodo(
      new Date(timePeriod.startDate),
      new Date(timePeriod.endDate),
    );
    return guerras.map((w) => this.toSimplifiedDto(w));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una guerra por id o slug' })
  @ApiOkResponse({ type: WarDto })
  @ApiNotFoundResponse({ description: 'Guerra no encontrada' })
  async getById(@Param('id') id: string): Promise<WarDto> {
    const guerra = await this.service.buscarPorId(id);
    return this.toDto(guerra);
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
