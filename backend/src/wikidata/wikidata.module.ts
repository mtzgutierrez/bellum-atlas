import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WikidataRepository } from './wikidata.repository';
import { WikidataService } from './wikidata.service';

@Module({
  imports: [PrismaModule],
  providers: [WikidataService, WikidataRepository],
  exports: [WikidataService],
})
export class WikidataModule {}
