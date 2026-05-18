import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaRepository } from './media.repository';

@Module({
  providers: [MediaRepository, MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
