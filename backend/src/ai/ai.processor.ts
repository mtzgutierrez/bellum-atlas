import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AI_QUEUE_NAME, BattleAIInput, GenerateAIJobData } from './ai.types';
import { LlmService } from './llm.service';
import { fetchArticleText } from './wikipedia-source';

// Worker BullMQ. Una sola responsabilidad: recibir un battleId, recoger su
// contexto, generar la historia con el LLM y persistir BattleAISummary.
// Idempotente: si ya existe summary, lo respeta (un re-encolado no
// sobreescribe accidentalmente cuando ya pagamos por la generación).
@Processor(AI_QUEUE_NAME, { concurrency: 4 })
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {
    super();
  }

  async process(job: Job<GenerateAIJobData>): Promise<void> {
    const { battleId, webSearch = false } = job.data;

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

    // Material de referencia: el artículo completo de Wikipedia; si no se puede
    // obtener, caemos al extract corto guardado en la BD.
    const article = await fetchArticleText(battle.wikipediaUrl);

    const input: BattleAIInput = {
      name: battle.name,
      year: battle.year,
      startYear: battle.startYear,
      endYear: battle.endYear,
      date: battle.date,
      startDate: battle.startDate,
      endDate: battle.endDate,
      type: battle.type,
      latitude: battle.latitude,
      longitude: battle.longitude,
      sourceText: article ?? battle.summary,
    };

    const story = await this.llm.generate(input, { webSearch });
    const promptHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const usedWebSearch = webSearch && this.llm.isReal();

    await this.prisma.battleAISummary.create({
      data: {
        battleId,
        summary: story.summary,
        context: story.context,
        outcome: story.outcome,
        curiosities: story.curiosities,
        modelUsed: this.llm.modelId(),
        promptHash,
        usedWebSearch,
      },
    });

    this.logger.log(
      `✓ Historia IA generada para "${battle.name}" (${battleId})${usedWebSearch ? ' [web]' : ''}`,
    );
  }
}
