import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { WarService } from './war.service';

@ApiTags('Wars')
@Controller('wars')
export class WarController {
  constructor(private readonly warService: WarService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar guerras',
    description: 'Listado paginado con búsqueda por nombre o descripción e incluye era y número de batallas.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda por nombre o descripción.' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Ítems por página (máx. 100).', example: 20 })
  @ApiOkResponse({
    description: 'Lista paginada de guerras.',
    schema: {
      example: {
        data: [{ id: 'cuid', name: 'Napoleonic Wars', slug: 'napoleonic-wars', battleCount: 42 }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    },
  })
  findAll(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.warService.findAll({
      q,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener guerra',
    description:
      'Ficha completa con era, ubicación, facciones, batallas ordenadas cronológicamente y estadísticas. Acepta CUID o slug.',
  })
  @ApiParam({ name: 'id', description: 'CUID o slug de la guerra.', example: 'napoleonic-wars' })
  @ApiOkResponse({ description: 'Ficha completa de la guerra.' })
  @ApiNotFoundResponse({ description: 'Guerra no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.warService.findOne(id);
  }
}
