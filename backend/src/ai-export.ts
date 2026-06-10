/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { BattleAIInput } from './ai/ai.types';
import { fetchArticleText } from './ai/wikipedia-source';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

// =============================================================================
// EXPORT del lote pendiente — lado de LECTURA del arnés de redacción por agente
// =============================================================================
// Saca las batallas SIN ficha de IA, ordenadas por importancia descendente, con
// su material de referencia (artículo de Wikipedia) ya resuelto, y las vuelca a
// un JSON que un agente Claude Code rellena a mano (summary/context/outcome/
// curiosities). Luego `ai-import` persiste lo redactado.
//
// Es la alternativa "sin coste de API" a pregen+worker: el agente ES el LLM.
// Ver docs/backend/prompt-redaccion-batallas.md.
//
// Uso (con el backend en marcha):
//   npm run ai:export                 # 25 pendientes top a .ai-batch/batch.json
//   npm run ai:export -- 50           # 50
//   MIN_SCORE=80 npm run ai:export -- 50
//   OFFSET=100 OUT=.ai-batch/lote2.json npm run ai:export -- 25
//   ./scripts/ai-batch.sh export 25   # wrapper docker exec
// =============================================================================

const DEFAULT_OUT = '.ai-batch/batch.json';

type Tier = 'critica' | 'alta' | 'media' | 'baja';

// Tramo de importancia → nivel de profundidad. Umbral 80 = AI_AUTO_QUEUE_MIN_SCORE.
function tierFor(score: number): { tier: Tier; webSearchRecommended: boolean } {
  if (score >= 80) return { tier: 'critica', webSearchRecommended: true };
  if (score >= 50) return { tier: 'alta', webSearchRecommended: true };
  if (score >= 20) return { tier: 'media', webSearchRecommended: false };
  return { tier: 'baja', webSearchRecommended: false };
}

// Ítem de trabajo. El agente rellena summary/context/outcome/curiosities y, si
// procede, pone usedWebSearch=true. El resto es de solo lectura para él.
interface WorkItem {
  battleId: string;
  name: string;
  type: BattleAIInput['type'];
  importanceScore: number;
  tier: Tier;
  webSearchRecommended: boolean;
  // Mismo input que ve el LLM en producción (para construir el prompt).
  input: BattleAIInput;
  // Hash del input exacto que vio el agente; se persiste tal cual (auditoría).
  promptHash: string;
  // ── A rellenar por el agente ──
  summary: string;
  context: string;
  outcome: string;
  curiosities: string;
  usedWebSearch: boolean;
}

async function main() {
  const count = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : 25;
  const minScore = Number(process.env.MIN_SCORE ?? 0);
  const offset = Number(process.env.OFFSET ?? 0);
  const out = process.env.OUT ?? DEFAULT_OUT;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  const battles = await prisma.battle.findMany({
    where: { aiSummary: { is: null }, importanceScore: { gte: minScore } },
    orderBy: { importanceScore: 'desc' },
    skip: offset,
    take: count,
  });

  console.log(
    `Pendientes seleccionadas: ${battles.length} (minScore=${minScore}, offset=${offset}). Resolviendo material…`,
  );

  const items: WorkItem[] = [];
  for (const b of battles) {
    // Material de referencia: artículo completo de Wikipedia; fallback al extract.
    const article = await fetchArticleText(b.wikipediaUrl);
    const input: BattleAIInput = {
      name: b.name,
      year: b.year,
      startYear: b.startYear,
      endYear: b.endYear,
      date: b.date,
      startDate: b.startDate,
      endDate: b.endDate,
      type: b.type,
      latitude: b.latitude,
      longitude: b.longitude,
      sourceText: article ?? b.summary,
    };
    const promptHash = createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex');
    const { tier, webSearchRecommended } = tierFor(b.importanceScore);
    items.push({
      battleId: b.id,
      name: b.name,
      type: b.type,
      importanceScore: b.importanceScore,
      tier,
      webSearchRecommended,
      input,
      promptHash,
      summary: '',
      context: '',
      outcome: '',
      curiosities: '',
      usedWebSearch: false,
    });
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(items, null, 2), 'utf8');

  const byTier = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.tier] = (acc[i.tier] ?? 0) + 1;
    return acc;
  }, {});
  const withoutSource = items.filter((i) => !i.input.sourceText).length;

  console.log(
    `✓ Exportadas ${items.length} fichas a ${out} ` +
      `(${Object.entries(byTier)
        .map(([t, n]) => `${t}:${n}`)
        .join(', ')})${withoutSource ? `, ${withoutSource} sin material` : ''}.`,
  );
  console.log(
    '\nSiguiente paso: el agente rellena summary/context/outcome/curiosities ' +
      `en ${out} siguiendo docs/backend/prompt-redaccion-batallas.md, y luego ` +
      '`npm run ai:import`.',
  );

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
