import { Module } from '@nestjs/common';
import { WikidataService } from './wikidata.service';

@Module({
  providers: [WikidataService]
})
export class WikidataModule {}
