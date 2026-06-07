import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AI_DAILY_QUEUE_NAME } from './ai.types';

// Registra (idempotentemente) un job repetible diario que dispara el
// enriquecimiento. El cron por defecto es a las 03:00; configurable con
// AI_DAILY_CRON.
@Injectable()
export class DailyScheduler implements OnModuleInit {
  private readonly logger = new Logger(DailyScheduler.name);

  constructor(@InjectQueue(AI_DAILY_QUEUE_NAME) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    const pattern = process.env.AI_DAILY_CRON ?? '0 3 * * *';
    // jobId fijo → re-registrar no duplica el repetible.
    await this.queue.add(
      'daily',
      {},
      {
        repeat: { pattern },
        jobId: 'daily-enrichment',
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
    this.logger.log(`Job diario de enriquecimiento programado (cron "${pattern}").`);
  }
}
