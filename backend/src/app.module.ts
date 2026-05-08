import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { BattleModule } from './battle/battle.module';
import { ScraperModule } from './scraper/scraper.module';
import { CommanderModule } from './commander/commander.module';
import { CommanderModule } from './commander/commander.module';
import { WarModule } from './war/war.module';
import { WarModule } from './war/war.module';
import { BattleModule } from './war/battle/battle.module';
import { BattleModule } from './battle/battle.module';


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
  ],
  controllers: [HealthController],
})
export class AppModule {}
