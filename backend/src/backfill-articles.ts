/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { fetchArticleText } from './ai/wikipedia-source';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

// =============================================================================
// PRE-CALENTAMIENTO de artículos de Wikipedia
// =============================================================================
// Rellena la columna `article` (extracto completo de Wikipedia) de las batallas
// más importantes que aún no lo tengan, con throttling para no recibir 429.
// Así la demo va instantánea; la carga perezosa cubre el resto del catálogo.
//
// Uso (backend en marcha):
//   npm run backfill:articles                 # top 200, 400ms entre peticiones
//   npm run backfill:articles -- 500          # top 500
//   DELAY_MS=700 npm run backfill:articles -- 300
//   docker exec bellum_atlas-backend-1 npm run backfill:articles -- 200
// =============================================================================

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const count = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : 200;
  const delayMs = Number(process.env.DELAY_MS ?? 400);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  const battles = await prisma.battle.findMany({
    where: { article: null, wikipediaUrl: { not: null } },
    orderBy: { importanceScore: 'desc' },
    take: count,
    select: { id: true, name: true, wikipediaUrl: true },
  });

  console.log(
    `Pre-calentando artículos: ${battles.length} batallas (delay ${delayMs}ms)…`,
  );

  let ok = 0;
  let empty = 0;
  for (let i = 0; i < battles.length; i++) {
    const b = battles[i];
    const text = await fetchArticleText(b.wikipediaUrl, 9000);
    if (text) {
      await prisma.battle.update({ where: { id: b.id }, data: { article: text } });
      ok += 1;
    } else {
      empty += 1;
    }
    if ((i + 1) % 25 === 0 || i === battles.length - 1) {
      console.log(`  ${i + 1}/${battles.length} (ok ${ok}, sin texto ${empty})`);
    }
    await sleep(delayMs);
  }

  console.log(`✓ Backfill terminado: ${ok} cacheadas, ${empty} sin texto.`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
