import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BattleController } from './battle.controller';
import { BattleRepository } from './battle.repository';
import { BattleService } from './battle.service';

@Module({
  imports: [PrismaModule],
  providers: [BattleService, BattleRepository],
  controllers: [BattleController],
  exports: [BattleService],
})
export class BattleModule {}
