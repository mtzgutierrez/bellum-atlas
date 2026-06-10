import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiQueueService } from './ai-queue.service';

// Construcción diaria de narrativa "premium" (completa, SIEMPRE con búsqueda web
// activada). Se genera como mucho UNA batalla al día, eligiéndola por prioridad:
//   1. La efeméride de hoy más importante que aún no tenga narrativa
//      (si la #1 ya la tiene, la #2, y así sucesivamente).
//   2. Si todas las efemérides de hoy ya la tienen (o no hay batallas de hoy),
//      la batalla más importante del catálogo global que aún no la tenga.
@Injectable()
export class DailyEnrichmentService {
  private readonly logger = new Logger(DailyEnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: AiQueueService,
  ) {}

  async run(): Promise<void> {
    const target = await this.pickTarget();
    if (!target) {
      this.logger.log(
        'Generación diaria: todas las batallas ya tienen narrativa. Nada que hacer.',
      );
      return;
    }
    // webSearch SIEMPRE: narrativa completa con fuentes externas.
    await this.queue.enqueue({
      battleId: target.id,
      reason: 'daily-enrichment',
      webSearch: true,
    });
    this.logger.log(
      `Generación diaria [${target.source}]: "${target.name}" (importancia ${target.importanceScore}).`,
    );
  }

  // Elige la batalla del día según la prioridad efeméride → global.
  async pickTarget(): Promise<{
    id: string;
    name: string;
    importanceScore: number;
    source: 'efeméride de hoy' | 'top global';
  } | null> {
    const now = new Date();
    const mmdd = `-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    // 1 + 2: la efeméride de hoy MÁS importante que aún NO tenga narrativa.
    // `aiSummary is null` salta automáticamente las que ya están generadas, así
    // que findFirst por importancia descendente da exactamente la siguiente.
    const efem = await this.prisma.battle.findFirst({
      where: {
        aiSummary: { is: null },
        OR: [{ date: { endsWith: mmdd } }, { startDate: { endsWith: mmdd } }],
      },
      orderBy: { importanceScore: 'desc' },
      select: { id: true, name: true, importanceScore: true },
    });
    if (efem) return { ...efem, source: 'efeméride de hoy' };

    // 3: la batalla MÁS importante del catálogo global que aún no tenga narrativa.
    const global = await this.prisma.battle.findFirst({
      where: { aiSummary: { is: null } },
      orderBy: { importanceScore: 'desc' },
      select: { id: true, name: true, importanceScore: true },
    });
    if (global) return { ...global, source: 'top global' };

    return null;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
