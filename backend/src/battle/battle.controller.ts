import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BattleType } from '@prisma/client';
import { BattleService } from './battle.service';
import { QueryBattleDto } from './dto/query-battle.dto';

@ApiTags('Battles')
@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar batallas',
    description: 'Listado paginado con búsqueda full-text y filtros por era, tipo, resultado y país.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda full-text: nombre, guerra o lugar.' })
  @ApiQuery({ name: 'era', required: false, description: 'Slug de era histórica (ej: "ancient", "medieval").' })
  @ApiQuery({
    name: 'result',
    required: false,
    enum: ['victory', 'defeat', 'draw', 'inconclusive'],
    description: 'Filtro por resultado.',
  })
  @ApiQuery({ name: 'type', required: false, enum: BattleType, description: 'Tipo de batalla.' })
  @ApiQuery({ name: 'country', required: false, description: 'País involucrado.' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Ítems por página (máx. 100).', example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['date', 'name'], description: 'Campo de ordenación.' })
  @ApiOkResponse({
    description: 'Lista paginada de batallas.',
    schema: {
      example: {
        data: [{ id: 'cuid', name: 'Battle of Waterloo', slug: 'battle-of-waterloo', date: '1815-06-18T00:00:00.000Z' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    },
  })
  findAll(
    @Query('q') q?: string,
    @Query('era') era?: string,
    @Query('result') result?: string,
    @Query('type') type?: BattleType,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: QueryBattleDto['sortBy'],
  ) {
    const dto: QueryBattleDto = {
      q,
      era,
      result,
      type,
      country,
      sortBy,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
    };
    return this.battleService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener batalla',
    description: 'Ficha completa de una batalla con era, ubicación, guerras, facciones, comandantes y media. Acepta CUID o slug.',
  })
  @ApiParam({ name: 'id', description: 'CUID o slug de la batalla.', example: 'battle-of-waterloo' })
  @ApiOkResponse({ description: 'Ficha completa de la batalla.' })
  @ApiNotFoundResponse({ description: 'Batalla no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.battleService.findOne(id);
  }
}
