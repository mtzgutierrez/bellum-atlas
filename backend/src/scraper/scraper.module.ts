import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScraperRepository } from './scraper.repository';

@Module({
  providers: [ScraperRepository, ScraperService],
  controllers: [ScraperController],
})
export class ScraperModule {}
