import { Module } from '@nestjs/common';
import { BattleService } from './battle.service';
import { BattleController } from './battle.controller';

@Module({
  providers: [BattleService],
  controllers: [BattleController],
  exports: [BattleService],
})
export class BattleModule {}
