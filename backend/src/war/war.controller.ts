import { Controller, Get, Param, Query } from '@nestjs/common';
import { WarService } from './war.service';

@Controller('wars')
export class WarController {
  constructor(private readonly warService: WarService) {}

  /**
   * GET /wars
   * Listado paginado de guerras con búsqueda opcional.
   */
  @Get()
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

  /**
   * GET /wars/:id
   * Ficha de guerra con batallas ordenadas cronológicamente y stats.
   * Acepta id (cuid) o slug.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warService.findOne(id);
  }
}
