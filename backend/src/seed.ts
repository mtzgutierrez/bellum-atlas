/* eslint-disable no-console */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AiQueueService } from './ai/ai-queue.service';
import { AppModule } from './app.module';
import { toSlug } from './common/utils/slug.util';
import { PrismaService } from './prisma/prisma.service';

// =============================================================================
// SEED offline — 3 batallas famosas (sin red)
// =============================================================================
// Para arranque rápido / tests sin depender de Wikidata. Para poblar de verdad
// usa `npm run ingest` (ver src/ingest.ts). Idempotente: upsert por slug.
// =============================================================================

const AI_PREGEN_MIN_SCORE = Number(process.env.AI_AUTO_QUEUE_MIN_SCORE ?? 80);

interface BattleSeed {
  name: string;
  year?: number;
  startYear?: number;
  endYear?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  latitude: number;
  longitude: number;
  type: 'BATTLE' | 'SIEGE' | 'CAMPAIGN';
  importanceScore: number;
  imageUrl?: string;
  wikipediaUrl?: string;
  summary?: string;
}

const BATTLES: BattleSeed[] = [
  {
    name: 'Batalla de Lepanto',
    year: 1571,
    date: '1571-10-07',
    latitude: 38.2126,
    longitude: 21.3236,
    type: 'BATTLE',
    importanceScore: 88,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Battle_of_Lepanto_1571.jpg/500px-Battle_of_Lepanto_1571.jpg',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_de_Lepanto',
    summary:
      'Combate naval librado el 7 de octubre de 1571 en el golfo de Patras, ' +
      'en el que la flota de la Liga Santa derrotó a la armada del Imperio ' +
      'otomano. Frenó la expansión otomana en el Mediterráneo occidental.',
  },
  {
    name: 'Batalla de Stalingrado',
    year: 1942,
    startYear: 1942,
    endYear: 1943,
    startDate: '1942-08-23',
    endDate: '1943-02-02',
    latitude: 48.708,
    longitude: 44.5133,
    type: 'SIEGE',
    importanceScore: 95,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/RIAN_archive_602161_Center_of_Stalingrad_after_liberation.jpg/500px-RIAN_archive_602161_Center_of_Stalingrad_after_liberation.jpg',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_de_Stalingrado',
    summary:
      'Enfrentamiento entre Alemania y la Unión Soviética por la ciudad de ' +
      'Stalingrado entre 1942 y 1943. Una de las batallas más sangrientas de ' +
      'la historia y punto de inflexión del frente oriental.',
  },
  {
    name: 'Batalla de Trafalgar',
    year: 1805,
    date: '1805-10-21',
    latitude: 36.28,
    longitude: -6.27,
    type: 'BATTLE',
    importanceScore: 90,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Trafalgar-Auguste_Mayer.jpg/500px-Trafalgar-Auguste_Mayer.jpg',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_de_Trafalgar',
    summary:
      'Batalla naval del 21 de octubre de 1805 frente al cabo de Trafalgar, ' +
      'en la que la flota británica de Nelson derrotó a la franco-española. ' +
      'Consolidó el dominio naval británico durante más de un siglo.',
  },
]

async function seedBattle(prisma: PrismaService, data: BattleSeed): Promise<string> {
  const slug = toSlug(data.name);
  const payload = {
    name: data.name,
    year: data.year ?? null,
    startYear: data.startYear ?? null,
    endYear: data.endYear ?? null,
    date: data.date ?? null,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    latitude: data.latitude,
    longitude: data.longitude,
    type: data.type,
    importanceScore: data.importanceScore,
    imageUrl: data.imageUrl ?? null,
    wikipediaUrl: data.wikipediaUrl ?? null,
    summary: data.summary ?? null,
  };
  const battle = await prisma.battle.upsert({
    where: { slug },
    create: { slug, ...payload },
    update: payload,
    select: { id: true },
  });
  return battle.id;
}

async function main() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const prisma = app.get(PrismaService);
  const queue = app.get(AiQueueService, { strict: false });

  const highScore: string[] = [];
  for (const data of BATTLES) {
    const id = await seedBattle(prisma, data);
    logger.log(`✓ ${data.name} (score ${data.importanceScore})`);
    if (data.importanceScore > AI_PREGEN_MIN_SCORE) highScore.push(id);
  }

  for (const battleId of highScore) {
    try {
      await queue.enqueue({ battleId, reason: 'auto-ingest' });
    } catch (err) {
      logger.warn(`No se pudo encolar IA para ${battleId}: ${(err as Error).message}`);
    }
  }

  logger.log(`Seed completado. ${BATTLES.length} batallas.`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
