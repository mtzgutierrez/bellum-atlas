import { Module } from '@nestjs/common';
import { CommanderService } from './commander.service';
import { CommanderController } from './commander.controller';

@Module({
  controllers: [CommanderController],
  providers: [CommanderService],
})
export class CommanderModule {}
