import { Controller, Get, Param, Query } from '@nestjs/common';
import { BattleType } from '@prisma/client';
import { BattleService } from './battle.service';
import { QueryBattleDto } from './dto/query-battle.dto';

@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  /**
   * GET /battles
   * Listado paginado con búsqueda full-text y filtros.
   *
   * Query params: q, era, result, type, country, page, limit, sortBy
   */
  @Get()
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

  /**
   * GET /battles/:id
   * Ficha completa de una batalla. Acepta id (cuid) o slug.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.battleService.findOne(id);
  }
}
