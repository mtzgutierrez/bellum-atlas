import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { normalizePagination } from '../common/pagination.dto';
import { CommanderWithRelations } from './commander.repository';
import { CommanderService } from './commander.service';
import {
  CommanderBattleRefDto,
  CommanderDto,
  CommanderSummaryDto,
  CommandersQueryDto,
  PaginatedCommandersDto,
} from './dto/commander.dto';

@ApiTags('Comandantes')
@Controller('commanders')
export class CommanderController {
  constructor(private readonly service: CommanderService) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de comandantes.' })
  @ApiOkResponse({ type: PaginatedCommandersDto })
  async list(@Query() q: CommandersQueryDto): Promise<PaginatedCommandersDto> {
    const { page, pageSize } = normalizePagination(q);
    const result = await this.service.list(q.search, { page, pageSize });
    return {
      data: result.data.map(
        (c): CommanderSummaryDto => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          birthYear: c.birthYear,
          deathYear: c.deathYear,
          imageUrl: c.imageUrl,
        }),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de comandante por id o slug.' })
  @ApiOkResponse({ type: CommanderDto })
  @ApiNotFoundResponse({ description: 'Comandante no encontrado' })
  async detail(@Param('id') id: string): Promise<CommanderDto> {
    return toDto(await this.service.findOne(id));
  }
}

function toDto(c: CommanderWithRelations): CommanderDto {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    birthYear: c.birthYear,
    deathYear: c.deathYear,
    imageUrl: c.imageUrl,
    summary: c.summary,
    wikipediaUrl: c.wikipediaUrl,
    battles: c.battles.map(
      (bc): CommanderBattleRefDto => ({
        id: bc.battle.id,
        name: bc.battle.name,
        slug: bc.battle.slug,
        year: bc.battle.year,
        side: bc.side,
      }),
    ),
  };
}
