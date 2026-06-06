import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IngestionService } from './ingestion.service';
import { WikidataClient } from './wikidata.client';

// Pipeline de ingesta desde Wikidata/Wikipedia. Reutiliza la cola de IA
// (AiModule) para encolar la generación de las batallas relevantes.
@Module({
  imports: [ConfigModule, PrismaModule, AiModule],
  providers: [WikidataClient, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
