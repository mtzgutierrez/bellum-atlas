import { Module } from '@nestjs/common';
import { BattleService } from './battle.service';
import { BattleController } from './battle.controller';
import { BattleRepository } from './battle.repository';

@Module({
  providers: [BattleRepository, BattleService],
  controllers: [BattleController],
  exports: [BattleService],
})
export class BattleModule {}
