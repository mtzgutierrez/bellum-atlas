import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AI_QUEUE_NAME, BattleAIInput, GenerateAIJobData } from './ai.types';
import { LlmService } from './llm.service';

// Worker BullMQ. Una sola responsabilidad: recibir un battleId, recoger su
// contexto, generar la historia con el LLM y persistir BattleAISummary.
// Idempotente: si ya existe summary, lo respeta (un re-encolado no
// sobreescribe accidentalmente cuando ya pagamos por la generación).
@Processor(AI_QUEUE_NAME, { concurrency: 2 })
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {
    super();
  }

  async process(job: Job<GenerateAIJobData>): Promise<void> {
    const { battleId } = job.data;

    const existing = await this.prisma.battleAISummary.findUnique({
      where: { battleId },
      select: { id: true },
    });
    if (existing) {
      this.logger.log(`Skip ${battleId}: summary ya existe.`);
      return;
    }

    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
    });
    if (!battle) {
      this.logger.warn(`Battle ${battleId} no encontrada (descartado).`);
      return;
    }

    const input: BattleAIInput = {
      name: battle.name,
      year: battle.year,
      startYear: battle.startYear,
      endYear: battle.endYear,
      wikipediaSummary: battle.summary,
    };

    const story = await this.llm.generate(input);
    const promptHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');

    await this.prisma.battleAISummary.create({
      data: {
        battleId,
        summary: story.summary,
        context: story.context,
        outcome: story.outcome,
        curiosities: story.curiosities,
        modelUsed: this.llm.modelId(),
        promptHash,
      },
    });

    this.logger.log(`✓ Historia IA generada para "${battle.name}" (${battleId})`);
  }
}
