import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommanderController } from './commander.controller';
import { CommanderRepository } from './commander.repository';
import { CommanderService } from './commander.service';

@Module({
  imports: [PrismaModule],
  providers: [CommanderService, CommanderRepository],
  controllers: [CommanderController],
  exports: [CommanderService],
})
export class CommanderModule {}
