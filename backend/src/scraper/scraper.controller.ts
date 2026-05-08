import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperBattleDto } from './dto/scraper-battle.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * Endpoints internos exclusivos para el scraper.
 * Protegidos por API key (header x-api-key).
 * No exponer en documentación pública.
 */
@Controller('internal/scraper')
@UseGuards(ApiKeyGuard)
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  /**
   * POST /internal/scraper/battle
   * Recibe un WikipediaItem normalizado y hace upsert de la batalla.
   * Deduplicación por `wikipediaUrl`.
   */
  @Post('battle')
  @HttpCode(HttpStatus.OK)
  upsertBattle(@Body() dto: ScraperBattleDto) {
    return this.scraperService.upsertBattle(dto);
  }
}
