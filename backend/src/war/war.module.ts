import { Module } from '@nestjs/common';
import { WarService } from './war.service';
import { WarController } from './war.controller';

@Module({
  providers: [WarService],
  controllers: [WarController],
  exports: [WarService],
})
export class WarModule {}
