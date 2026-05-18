import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommanderService } from './commander.service';

@ApiTags('Commanders')
@Controller('commanders')
export class CommanderController {
  constructor(private readonly commanderService: CommanderService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar comandantes',
    description: 'Listado paginado con búsqueda por nombre e incluye el número de batallas.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda por nombre de comandante.' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Ítems por página (máx. 100).', example: 20 })
  @ApiOkResponse({
    description: 'Lista paginada de comandantes.',
    schema: {
      example: {
        data: [{ id: 'cuid', name: 'Napoléon Bonaparte', country: 'France', battleCount: 20 }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    },
  })
  findAll(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commanderService.findAll({
      q,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener comandante',
    description: 'Perfil completo con historial de batallas, guerras, media y estadísticas (victorias y winRate).',
  })
  @ApiParam({ name: 'id', description: 'CUID del comandante.' })
  @ApiOkResponse({ description: 'Perfil completo del comandante.' })
  @ApiNotFoundResponse({ description: 'Comandante no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.commanderService.findOne(id);
  }
}
