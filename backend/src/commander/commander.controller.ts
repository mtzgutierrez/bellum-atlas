import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  SimplifiedCommanderDto,
} from './dto/commander.dto';

@ApiTags('Comandantes')
@Controller('commander')
export class CommanderController {
  constructor(private readonly service: CommanderService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comandantes (vista simplificada)' })
  @ApiOkResponse({ type: [SimplifiedCommanderDto] })
  async getAll(): Promise<SimplifiedCommanderDto[]> {
    const comandantes = await this.service.listar();
    return comandantes.map((c) => this.toSimplifiedDto(c));
  }

  @Get('search/:name')
  @ApiOperation({ summary: 'Buscar comandantes por nombre o alias' })
  @ApiOkResponse({ type: [SimplifiedCommanderDto] })
  async searchByName(
    @Param('name') name: string,
  ): Promise<SimplifiedCommanderDto[]> {
    const comandantes = await this.service.buscarPorNombre(name);
    return comandantes.map((c) => this.toSimplifiedDto(c));
  }

  @Get('country/:country')
  @ApiOperation({ summary: 'Buscar comandantes por país (nacionalidad)' })
  @ApiOkResponse({ type: [SimplifiedCommanderDto] })
  async getByCountry(
    @Param('country') country: string,
  ): Promise<SimplifiedCommanderDto[]> {
    const comandantes = await this.service.buscarPorPais(country);
    return comandantes.map((c) => this.toSimplifiedDto(c));
  }

  @Post('years')
  @ApiOperation({
    summary:
      'Buscar comandantes vivos en algún momento del rango de años indicado',
  })
  @ApiOkResponse({ type: [SimplifiedCommanderDto] })
  async getByYears(
    @Body() years: GetCommandersByYearsDto,
  ): Promise<SimplifiedCommanderDto[]> {
    const comandantes = await this.service.buscarPorAnios(
      years.startYear,
      years.endYear,
    );
    return comandantes.map((c) => this.toSimplifiedDto(c));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener el detalle de un comandante por id o slug',
  })
  @ApiOkResponse({ type: CommanderDto })
  @ApiNotFoundResponse({ description: 'Comandante no encontrado' })
  async getById(@Param('id') id: string): Promise<CommanderDto> {
    const comandante = await this.service.buscarPorId(id);
    return this.toDto(comandante);
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
