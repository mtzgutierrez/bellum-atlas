/* eslint-disable no-console */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WikidataModule } from './wikidata/wikidata.module';
import { WikidataService } from './wikidata/wikidata.service';
import type { BulkOpts } from './wikidata/wikidata.service';

type SingleType = 'battle' | 'war' | 'commander' | 'war-tree';
type BulkType = 'all-battles' | 'all-wars' | 'all-commanders' | 'all';
type Target =
  | { mode: 'single'; type: SingleType; qid: string }
  | { mode: 'bulk'; type: BulkType };

const SINGLE_TYPES: SingleType[] = ['battle', 'war', 'commander', 'war-tree'];
const BULK_TYPES: BulkType[] = ['all-battles', 'all-wars', 'all-commanders', 'all'];

// Args:
//   npm run seed -- battle:Q165425 war:Q193689 commander:Q517
//   npm run seed -- all-battles
//   npm run seed -- all                          # batallas + guerras + comandantes
//
// Env vars (opcionales) para modo bulk:
//   PAGE_SIZE=500  BATCH_SIZE=50  DELAY_MS=1000  MAX_PAGES=2
function parseArgs(argv: string[]): Target[] {
  const args = argv.slice(2);
  if (args.length === 0) {
    throw new Error(
      'Sin argumentos. Usa <tipo>:<QID> o uno de: ' + BULK_TYPES.join(', '),
    );
  }
  return args.map((arg) => {
    if ((BULK_TYPES as string[]).includes(arg)) {
      return { mode: 'bulk', type: arg as BulkType };
    }
    const [type, qid] = arg.split(':');
    if (!type || !qid) {
      throw new Error(`Argumento inválido "${arg}".`);
    }
    if (!(SINGLE_TYPES as string[]).includes(type)) {
      throw new Error(
        `Tipo "${type}" no soportado. Válidos: ${[
          ...SINGLE_TYPES,
          ...BULK_TYPES,
        ].join(', ')}`,
      );
    }
    if (!/^Q\d+$/.test(qid)) {
      throw new Error(`QID inválido "${qid}".`);
    }
    return { mode: 'single', type: type as SingleType, qid };
  });
}

function bulkOptsFromEnv(): BulkOpts {
  const num = (s: string | undefined) => (s ? Number(s) : undefined);
  return {
    pageSize: num(process.env.PAGE_SIZE),
    batchSize: num(process.env.BATCH_SIZE),
    delayMs: num(process.env.DELAY_MS),
    maxPages: num(process.env.MAX_PAGES),
  };
}

async function main() {
  const logger = new Logger('Seed');
  const targets = parseArgs(process.argv);
  const bulkOpts = bulkOptsFromEnv();

  const app = await NestFactory.createApplicationContext(WikidataModule, {
    logger: ['log', 'warn', 'error'],
  });
  const service = app.get(WikidataService);

  let ok = 0;
  let fail = 0;
  for (const target of targets) {
    const label = target.mode === 'single' ? `${target.type}:${target.qid}` : target.type;
    try {
      logger.log(`→ ${label}`);
      if (target.mode === 'single') {
        await runSingle(service, target.type, target.qid);
      } else {
        await runBulk(service, target.type, bulkOpts);
      }
      logger.log(`✓ ${label}`);
      ok += 1;
    } catch (err) {
      logger.error(`✗ ${label}: ${(err as Error).message}`);
      fail += 1;
    }
  }

  logger.log(`Completado. OK=${ok} FAIL=${fail}`);
  await app.close();
  if (fail > 0) process.exitCode = 1;
}

async function runSingle(
  service: WikidataService,
  type: SingleType,
  qid: string,
) {
  switch (type) {
    case 'battle':
      await service.seedBattle(qid);
      return;
    case 'war':
      await service.seedWar(qid);
      return;
    case 'commander':
      await service.seedCommander(qid);
      return;
    case 'war-tree':
      await service.seedWarWithChildren(qid);
      return;
  }
}

async function runBulk(
  service: WikidataService,
  type: BulkType,
  opts: BulkOpts,
) {
  switch (type) {
    case 'all-battles':
      await service.bulkSyncBattles(opts);
      return;
    case 'all-wars':
      await service.bulkSyncWars(opts);
      return;
    case 'all-commanders':
      await service.bulkSyncCommanders(opts);
      return;
    case 'all':
      await service.bulkSyncBattles(opts);
      await service.bulkSyncWars(opts);
      await service.bulkSyncCommanders(opts);
      return;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
