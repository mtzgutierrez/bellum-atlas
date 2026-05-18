import { Module } from '@nestjs/common';
import { WarService } from './war.service';
import { WarController } from './war.controller';
import { WarRepository } from './war.repository';

@Module({
  providers: [WarRepository, WarService],
  controllers: [WarController],
  exports: [WarService],
})
export class WarModule {}
