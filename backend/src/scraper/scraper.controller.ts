import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { ScraperBattleDto } from './dto/scraper-battle.dto';
import { ScraperWarDto } from './dto/scraper-war.dto';
import { ScraperCommanderDto } from './dto/scraper-commander.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('Scraper (Internal)')
@ApiSecurity('x-api-key')
@Controller('internal/scraper')
@UseGuards(ApiKeyGuard)
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('battle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert de batalla',
    description: 'Crea o actualiza una batalla. Deduplicación por `wikipediaUrl`.',
  })
  @ApiOkResponse({
    description: 'Batalla creada o actualizada.',
    schema: { example: { id: 'cuid', slug: 'batalla-del-ebro', name: 'Batalla del Ebro' } },
  })
  @ApiUnauthorizedResponse({ description: 'API key inválida o ausente.' })
  upsertBattle(@Body() dto: ScraperBattleDto) {
    return this.scraperService.upsertBattle(dto);
  }

  @Post('war')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert de guerra',
    description: 'Crea o actualiza una guerra. Deduplicación por `wikipediaUrl`.',
  })
  @ApiOkResponse({
    description: 'Guerra creada o actualizada.',
    schema: { example: { id: 'cuid', slug: 'guerra-civil-espanola', name: 'Guerra Civil Española' } },
  })
  @ApiUnauthorizedResponse({ description: 'API key inválida o ausente.' })
  upsertWar(@Body() dto: ScraperWarDto) {
    return this.scraperService.upsertWar(dto);
  }

  @Post('commander')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert de comandante',
    description: 'Crea o actualiza un comandante. Deduplicación por `wikipediaUrl`.',
  })
  @ApiOkResponse({
    description: 'Comandante creado o actualizado.',
    schema: { example: { id: 'cuid', name: 'Francisco Franco' } },
  })
  @ApiUnauthorizedResponse({ description: 'API key inválida o ausente.' })
  upsertCommander(@Body() dto: ScraperCommanderDto) {
    return this.scraperService.upsertCommander(dto);
  }
}
