import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { BattleModule } from './battle/battle.module';
import { WarModule } from './war/war.module';
import { CommanderModule } from './commander/commander.module';
import { ScraperModule } from './scraper/scraper.module';
import { MediaModule } from './media/media.module';
import { WikidataModule } from './wikidata/wikidata.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    PrismaModule,
    BattleModule,
    WarModule,
    CommanderModule,
    ScraperModule,
    MediaModule,
    WikidataModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
