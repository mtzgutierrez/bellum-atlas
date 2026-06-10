import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IngestionService } from './ingestion.service';
import { WikidataClient } from './wikidata.client';

// Pipeline de ingesta desde Wikidata/Wikipedia. Solo persiste datos; la
// generación de narrativa por IA la decide el enriquecimiento diario, no la
// ingesta.
@Module({
  imports: [PrismaModule],
  providers: [WikidataClient, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
