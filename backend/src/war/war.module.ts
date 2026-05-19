import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WarController } from './war.controller';
import { WarRepository } from './war.repository';
import { WarService } from './war.service';

@Module({
  imports: [PrismaModule],
  providers: [WarService, WarRepository],
  controllers: [WarController],
  exports: [WarService],
})
export class WarModule {}
