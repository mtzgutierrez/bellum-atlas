/* eslint-disable no-console */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'fs';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

// =============================================================================
// IMPORT de fichas redactadas — lado de ESCRITURA del arnés
// =============================================================================
// Lee el JSON que `ai-export` generó y que el agente rellenó a mano, y crea las
// filas en battle_ai_summaries. Idempotente y no destructivo:
//   - salta los ítems sin los 4 campos completos (aún sin redactar),
//   - salta los que ya tienen ficha (nunca sobrescribe lo ya "pagado").
//
// modelUsed refleja el modelo real del agente (decisión: fichas "iguales, sin
// distinguir" de las de la API). promptHash se persiste tal cual lo calculó el
// export, para que audite el input exacto que vio el agente.
//
// Uso (con el backend en marcha):
//   npm run ai:import                      # lee .ai-batch/batch.json
//   IN=.ai-batch/lote2.json npm run ai:import
//   AI_BATCH_MODEL=claude-opus-4-8 npm run ai:import
//   ./scripts/ai-batch.sh import           # wrapper docker exec
// =============================================================================

const DEFAULT_IN = '.ai-batch/batch.json';

interface WorkItem {
  battleId: string;
  name: string;
  promptHash: string;
  summary: string;
  context: string;
  outcome: string;
  curiosities: string;
  usedWebSearch: boolean;
}

const filled = (s: unknown): s is string =>
  typeof s === 'string' && s.trim().length > 0;

async function main() {
  const logger = new Logger('ai-import');
  const inPath = process.env.IN ?? DEFAULT_IN;
  // Modelo REAL del agente que redacta (no el AI_MODEL de la API). Override con
  // AI_BATCH_MODEL si ejecuta otro modelo.
  const model = process.env.AI_BATCH_MODEL ?? 'claude-opus-4-8';

  const items = JSON.parse(readFileSync(inPath, 'utf8')) as WorkItem[];

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  let created = 0;
  let skippedExisting = 0;
  let skippedIncomplete = 0;
  let missingBattle = 0;

  for (const item of items) {
    if (
      !filled(item.summary) ||
      !filled(item.context) ||
      !filled(item.outcome) ||
      !filled(item.curiosities)
    ) {
      skippedIncomplete += 1;
      continue;
    }

    const battle = await prisma.battle.findUnique({
      where: { id: item.battleId },
      select: { id: true, aiSummary: { select: { id: true } } },
    });
    if (!battle) {
      logger.warn(`Batalla ${item.battleId} ("${item.name}") no existe; salto.`);
      missingBattle += 1;
      continue;
    }
    if (battle.aiSummary) {
      skippedExisting += 1;
      continue;
    }

    await prisma.battleAISummary.create({
      data: {
        battleId: item.battleId,
        summary: item.summary.trim(),
        context: item.context.trim(),
        outcome: item.outcome.trim(),
        curiosities: item.curiosities.trim(),
        modelUsed: model,
        promptHash: item.promptHash,
        usedWebSearch: Boolean(item.usedWebSearch),
      },
    });
    created += 1;
  }

  console.log(
    `✓ Import (modelo ${model}): creadas ${created}, ya existían ${skippedExisting}, ` +
      `sin redactar ${skippedIncomplete}` +
      (missingBattle ? `, batalla inexistente ${missingBattle}` : '') +
      ` (de ${items.length}).`,
  );

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
