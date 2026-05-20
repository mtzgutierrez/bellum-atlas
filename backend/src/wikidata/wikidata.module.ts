import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WikidataRepository } from './wikidata.repository';
import { WikidataService } from './wikidata.service';
import { WikipediaService } from './wikipedia.service';

@Module({
  imports: [PrismaModule],
  providers: [WikidataService, WikidataRepository, WikipediaService],
  exports: [WikidataService],
})
export class WikidataModule {}
