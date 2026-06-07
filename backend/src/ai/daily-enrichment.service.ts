import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiQueueService } from './ai-queue.service';

// Enriquecimiento incremental diario. Con un presupuesto pequeño (por defecto
// 15 batallas/día) sube narrativas a tier "web search", priorizando:
//   1. las efemérides de hoy (lo que sale en portada) que aún no sean web,
//   2. y, con el cupo restante, el backlog de batallas en básica por importancia.
// Así la calidad crece sin gastar un dineral de golpe.
@Injectable()
export class DailyEnrichmentService {
  private readonly logger = new Logger(DailyEnrichmentService.name);
  private readonly budget: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: AiQueueService,
    config: ConfigService,
  ) {
    this.budget = Number(config.get<string>('AI_DAILY_WEB_BUDGET') ?? 15);
  }

  async run(): Promise<void> {
    let remaining = this.budget;
    this.logger.log(`Enriquecimiento diario: presupuesto ${remaining}.`);

    // ── 1. Efemérides de hoy que aún no son "web" ──────────────────────────
    const now = new Date();
    const mmdd = `-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const efem = await this.prisma.battle.findMany({
      where: { OR: [{ date: { endsWith: mmdd } }, { startDate: { endsWith: mmdd } }] },
      orderBy: { importanceScore: 'desc' },
      take: 50,
      select: { id: true, name: true, aiSummary: { select: { usedWebSearch: true } } },
    });
    for (const b of efem) {
      if (remaining <= 0) break;
      if (b.aiSummary?.usedWebSearch) continue; // ya es web
      await this.upgrade(b.id, b.name);
      remaining -= 1;
    }

    // ── 2. Backlog: batallas en básica, por importancia ────────────────────
    if (remaining > 0) {
      const basics = await this.prisma.battle.findMany({
        where: { aiSummary: { is: { usedWebSearch: false } } },
        orderBy: { importanceScore: 'desc' },
        take: remaining,
        select: { id: true, name: true },
      });
      for (const b of basics) {
        if (remaining <= 0) break;
        await this.upgrade(b.id, b.name);
        remaining -= 1;
      }
    }

    this.logger.log(
      `Enriquecimiento diario: encoladas ${this.budget - remaining} batallas a tier web.`,
    );
  }

  // Borra la narrativa actual (el worker salta si ya existe) y re-encola con web.
  private async upgrade(battleId: string, name: string): Promise<void> {
    await this.prisma.battleAISummary
      .delete({ where: { battleId } })
      .catch(() => undefined);
    await this.queue.enqueue({
      battleId,
      reason: 'daily-enrichment',
      webSearch: true,
    });
    this.logger.log(`↑ web: ${name}`);
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
