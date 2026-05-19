import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { BattleModule } from './battle/battle.module';
import { CommanderModule } from './commander/commander.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { WarModule } from './war/war.module';
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
    WikidataModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
