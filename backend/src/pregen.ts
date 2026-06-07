/* eslint-disable no-console */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { Pool } from 'pg';
import { AI_QUEUE_NAME, GenerateAIJobData } from './ai/ai.types';

// =============================================================================
// PRE-GENERACIÓN POR TRAMOS de narrativas IA
// =============================================================================
// Construye la base de contenido por importancia:
//   - top <webCount>      → tier WEB   (con búsqueda web, más caro/rico)
//   - siguientes <basic>  → tier BÁSICO (solo artículo de Wikipedia)
//   - el resto            → nada (quedan en el sistema sin narrativa)
//
// Solo encola; el worker del backend genera. Idempotente: salta las que ya
// están en el tier deseado con el modelo actual; regenera las que difieran.
//
// Uso (con el backend en marcha):
//   npm run pregen                 # 100 web + 900 básica (defecto)
//   npm run pregen -- 100 900
//   ./scripts/pregen.sh 100 900    # wrapper docker exec
// =============================================================================

function currentModel(): string {
  const provider = (process.env.AI_PROVIDER ?? 'mock').toLowerCase();
  return provider === 'anthropic'
    ? (process.env.AI_MODEL ?? 'claude-sonnet-4-6')
    : 'mock';
}

async function main() {
  const webCount = Number(process.argv[2]) >= 0 ? Number(process.argv[2]) : 100;
  const basicCount = Number(process.argv[3]) >= 0 ? Number(process.argv[3]) : 900;
  const total = webCount + basicCount;
  const model = currentModel();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const queue = new Queue<GenerateAIJobData>(AI_QUEUE_NAME, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });

  const top = await prisma.battle.findMany({
    orderBy: { importanceScore: 'desc' },
    take: total,
    select: {
      id: true,
      name: true,
      importanceScore: true,
      aiSummary: { select: { modelUsed: true, usedWebSearch: true } },
    },
  });

  // SEGURIDAD: re-generar implica BORRAR la narrativa existente, que es cara de
  // producir. Por defecto NO se borra nada: las fichas ya generadas se preservan
  // y solo se encolan las que faltan. Para regenerar de verdad (cambiar de tier/
  // modelo) hay que pedirlo explícitamente con PREGEN_ALLOW_DELETE=true.
  const allowDelete = (process.env.PREGEN_ALLOW_DELETE ?? '').toLowerCase() === 'true';

  let webQueued = 0;
  let basicQueued = 0;
  let skipped = 0;
  let preserved = 0;
  for (let i = 0; i < top.length; i++) {
    const b = top[i];
    const wantWeb = i < webCount;
    const cur = b.aiSummary;

    // Ya está en el tier deseado y con el modelo actual → nada que hacer.
    if (cur && cur.modelUsed === model && cur.usedWebSearch === wantWeb) {
      skipped += 1;
      continue;
    }
    // Existe pero difiere de tier/modelo. Sin permiso explícito, la PRESERVAMOS
    // (no se borra ni se re-encola) para no destruir contenido pagado.
    if (cur && !allowDelete) {
      preserved += 1;
      continue;
    }
    // Cambiar de tier/modelo con permiso: borramos la narrativa actual (el
    // worker salta si existe) y re-encolamos con el tier correcto.
    if (cur) {
      await prisma.battleAISummary.delete({ where: { battleId: b.id } });
    }
    await queue.remove(b.id).catch(() => undefined);
    await queue.add(
      'generate',
      { battleId: b.id, reason: 'auto-ingest', webSearch: wantWeb },
      {
        jobId: b.id,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: true,
        removeOnFail: { age: 3600 * 24 * 7 },
      },
    );
    if (wantWeb) webQueued += 1;
    else basicQueued += 1;
  }

  console.log(
    `\nPre-generación (modelo ${model}): web ${webQueued}, básica ${basicQueued}, ` +
      `ya al día ${skipped}, preservadas ${preserved}` +
      `${preserved && !allowDelete ? ' (usa PREGEN_ALLOW_DELETE=true para regenerarlas)' : ''} ` +
      `(de top ${top.length}).`,
  );
  console.log('El worker del backend las irá generando en segundo plano.');

  await queue.close();
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
