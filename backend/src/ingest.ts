/* eslint-disable no-console */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  IngestionService,
  type BulkOptions,
  type IngestOptions,
} from './ingestion/ingestion.service';

// =============================================================================
// CLI de INGESTA desde Wikidata / Wikipedia
// =============================================================================
// Uso (dentro del contenedor backend):
//   npm run ingest -- battle:Q165425                # una batalla por QID
//   npm run ingest -- top-battles                   # top-N batallas del mundo
//   npm run ingest -- all-battles                   # TODAS (bulk core paginado)
//
// Variables de entorno opcionales (modo bulk):
//   top-battles:  TOP_LIMIT=50  TOP_OFFSET=0  DELAY_MS=1000
//   all-battles:  PAGE_SIZE=200  MAX_PAGES=5  START_OFFSET=0  DELAY_MS=1000
//                 (MAX_PAGES=0 → sin límite, ingiere de verdad todas)
//
// Wrapper cómodo: ./scripts/ingest.sh battle:Q165425
// =============================================================================

type Target =
  | { mode: 'battle'; qid: string }
  | { mode: 'top-battles' }
  | { mode: 'all-battles' };

function parseArgs(argv: string[]): Target[] {
  const args = argv.slice(2);
  if (args.length === 0) {
    throw new Error(
      'Sin argumentos. Usa battle:<QID>, "top-battles" o "all-battles".',
    );
  }
  return args.map((arg) => {
    if (arg === 'top-battles') return { mode: 'top-battles' } as const;
    if (arg === 'all-battles') return { mode: 'all-battles' } as const;
    const [type, qid] = arg.split(':');
    if (type !== 'battle' || !qid) {
      throw new Error(
        `Argumento inválido "${arg}". Usa battle:<QID>, "top-battles" o "all-battles".`,
      );
    }
    if (!/^Q\d+$/.test(qid)) throw new Error(`QID inválido "${qid}".`);
    return { mode: 'battle', qid } as const;
  });
}

async function main() {
  const logger = new Logger('Ingest');
  const targets = parseArgs(process.argv);
  const opts: IngestOptions = {
    delayMs: process.env.DELAY_MS ? Number(process.env.DELAY_MS) : undefined,
  };

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const ingestion = app.get(IngestionService, { strict: false });

  let ok = 0;
  let fail = 0;
  for (const target of targets) {
    const label = target.mode === 'battle' ? `battle:${target.qid}` : target.mode;
    try {
      logger.log(`→ ${label}`);
      await runTarget(ingestion, target, opts);
      ok += 1;
    } catch (err) {
      logger.error(`✗ ${label}: ${(err as Error).message}`);
      fail += 1;
    }
  }

  logger.log(`Ingesta completada. OK=${ok} FAIL=${fail}`);
  await app.close();
  if (fail > 0) process.exitCode = 1;
}

async function runTarget(
  ingestion: IngestionService,
  target: Target,
  opts: IngestOptions,
): Promise<void> {
  if (target.mode === 'battle') {
    await ingestion.ingestBattle(target.qid);
    return;
  }
  if (target.mode === 'top-battles') {
    const limit = process.env.TOP_LIMIT ? Number(process.env.TOP_LIMIT) : 50;
    const offset = process.env.TOP_OFFSET ? Number(process.env.TOP_OFFSET) : 0;
    await ingestion.ingestTopBattles(limit, offset, opts);
    return;
  }
  // all-battles
  const bulk: BulkOptions = {
    ...opts,
    pageSize: process.env.PAGE_SIZE ? Number(process.env.PAGE_SIZE) : undefined,
    maxPages: process.env.MAX_PAGES ? Number(process.env.MAX_PAGES) : undefined,
    startOffset: process.env.START_OFFSET
      ? Number(process.env.START_OFFSET)
      : undefined,
  };
  await ingestion.ingestAllBattles(bulk);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
