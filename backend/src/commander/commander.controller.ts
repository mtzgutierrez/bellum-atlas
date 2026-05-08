import { Controller, Get, Param, Query } from '@nestjs/common';
import { CommanderService } from './commander.service';

@Controller('commanders')
export class CommanderController {
  constructor(private readonly commanderService: CommanderService) {}

  /**
   * GET /commanders
   * Listado paginado con búsqueda por nombre.
   */
  @Get()
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

  /**
   * GET /commanders/:id
   * Perfil completo con historial de batallas y ratio de victorias.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commanderService.findOne(id);
  }
}
