import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { DailyEnrichmentService } from './daily-enrichment.service';
import { AI_DAILY_QUEUE_NAME } from './ai.types';

// Worker del job repetible diario: dispara el enriquecimiento incremental.
@Processor(AI_DAILY_QUEUE_NAME)
export class DailyProcessor extends WorkerHost {
  private readonly logger = new Logger(DailyProcessor.name);

  constructor(private readonly enrichment: DailyEnrichmentService) {
    super();
  }

  async process(): Promise<void> {
    await this.enrichment.run();
  }
}
