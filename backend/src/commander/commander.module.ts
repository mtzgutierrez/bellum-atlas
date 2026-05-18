import { Module } from '@nestjs/common';
import { CommanderService } from './commander.service';
import { CommanderController } from './commander.controller';
import { CommanderRepository } from './commander.repository';

@Module({
  controllers: [CommanderController],
  providers: [CommanderRepository, CommanderService],
  exports: [CommanderService],
})
export class CommanderModule {}
