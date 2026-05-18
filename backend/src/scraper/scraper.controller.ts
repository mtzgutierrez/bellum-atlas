import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { ScraperBattleDto } from './dto/scraper-battle.dto';
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
    description:
      'Recibe un WikipediaItem normalizado y hace upsert de la batalla. ' +
      'La deduplicación se realiza por `wikipediaUrl`. Requiere el header `x-api-key`.',
  })
  @ApiOkResponse({
    description: 'Batalla creada o actualizada.',
    schema: { example: { id: 'cuid', slug: 'battle-of-waterloo', name: 'Battle of Waterloo' } },
  })
  @ApiUnauthorizedResponse({ description: 'API key inválida o ausente.' })
  upsertBattle(@Body() dto: ScraperBattleDto) {
    return this.scraperService.upsertBattle(dto);
  }
}
