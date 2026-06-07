import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AI_QUEUE_NAME, GenerateAIJobData } from './ai.types';

// Fachada sobre la cola BullMQ. El resto del código encola así, sin
// conocer los detalles del backend (Redis, retries, etc.).
@Injectable()
export class AiQueueService {
  private readonly logger = new Logger(AiQueueService.name);

  constructor(
    @InjectQueue(AI_QUEUE_NAME) private readonly queue: Queue<GenerateAIJobData>,
  ) {}

  // jobId estable (battleId) para deduplicar peticiones simultáneas. Antes de
  // encolar, eliminamos cualquier job previo con ese id (completado/fallido/en
  // espera): si no, BullMQ ignoraría el re-encolado y nunca se regeneraría una
  // batalla cuyo resumen se ha borrado. (Si el job está activo, remove() falla
  // y lo ignoramos: ya se está generando.) El worker, además, salta si el
  // resumen ya existe, así que esto solo dispara generación cuando hace falta.
  async enqueue(data: GenerateAIJobData): Promise<void> {
    await this.queue.remove(data.battleId).catch(() => undefined);
    await this.queue.add('generate', data, {
      jobId: data.battleId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: true,
      removeOnFail: { age: 3600 * 24 * 7 },
    });
    this.logger.log(`Encolado IA para ${data.battleId} (${data.reason})`);
  }

  async queuePosition(battleId: string): Promise<number | undefined> {
    const job = await this.queue.getJob(battleId);
    if (!job) return undefined;
    const state = await job.getState();
    if (state === 'completed' || state === 'failed') return undefined;
    const waiting = await this.queue.getWaitingCount();
    return waiting;
  }
}
