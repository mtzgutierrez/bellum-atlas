import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WarController } from './war.controller';
import { WarRepository } from './war.repository';
import { WarService } from './war.service';

@Module({
  imports: [PrismaModule],
  controllers: [WarController],
  providers: [WarService, WarRepository],
  exports: [WarService, WarRepository],
})
export class WarModule {}
