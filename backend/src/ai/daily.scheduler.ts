import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AI_DAILY_QUEUE_NAME } from './ai.types';

// Registra (idempotentemente) un job repetible diario que construye la
// narrativa de UNA batalla. El cron por defecto es a las 00:01; configurable
// con AI_DAILY_CRON.
@Injectable()
export class DailyScheduler implements OnModuleInit {
  private readonly logger = new Logger(DailyScheduler.name);

  constructor(@InjectQueue(AI_DAILY_QUEUE_NAME) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    const pattern = process.env.AI_DAILY_CRON ?? '1 0 * * *';
    // BullMQ no deduplica repetibles por jobId cuando cambia el patrón: limpiamos
    // cualquier repetible previo (p. ej. un cron antiguo a las 03:00) para no
    // acumular varios disparos al día.
    const existing = await this.queue.getRepeatableJobs();
    for (const r of existing) {
      await this.queue.removeRepeatableByKey(r.key).catch(() => undefined);
    }
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
    this.logger.log(`Generación diaria programada (cron "${pattern}", 1 batalla/día).`);
  }
}
