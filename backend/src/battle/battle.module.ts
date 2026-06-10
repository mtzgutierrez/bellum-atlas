import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BattleController } from './battle.controller';
import { BattleRepository } from './battle.repository';
import { BattleService } from './battle.service';

@Module({
  imports: [PrismaModule],
  controllers: [BattleController],
  providers: [BattleService, BattleRepository],
  exports: [BattleService, BattleRepository],
})
export class BattleModule {}
