import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AiController } from '../src/ai/ai.controller';
import { BattleController } from '../src/battle/battle.controller';
import { BattleRepository } from '../src/battle/battle.repository';
import { BattleService } from '../src/battle/battle.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as wikipediaSource from '../src/ai/wikipedia-source';

// El backfill de artículo hace fetch externo; lo mockeamos para no salir a red.
jest.mock('../src/ai/wikipedia-source');
const fetchArticleText = wikipediaSource.fetchArticleText as jest.Mock;

// Pruebas de integración contra una PostgreSQL REAL (docker-compose.test.yml).
// Montamos solo lo que depende de Prisma: battles + ai-story (sin Redis/BullMQ).
describe('Battles (e2e, Postgres real)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const todayMmdd = `-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [BattleController, AiController],
      providers: [BattleService, BattleRepository],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.battleAISummary.deleteMany();
    await prisma.battle.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.battleAISummary.deleteMany();
    await prisma.battle.deleteMany();
    fetchArticleText.mockReset();
  });

  const seed = () =>
    prisma.battle.createMany({
      data: [
        {
          name: 'Batalla de Waterloo',
          slug: 'batalla-de-waterloo',
          year: 1815,
          latitude: 50.68,
          longitude: 4.41,
          type: 'BATTLE',
          importanceScore: 95,
          wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_de_Waterloo',
        },
        {
          name: 'Asedio de Constantinopla',
          slug: 'asedio-de-constantinopla',
          year: 1453,
          latitude: 41.0,
          longitude: 28.97,
          type: 'SIEGE',
          importanceScore: 80,
        },
        {
          name: 'Batalla sin coordenadas',
          slug: 'batalla-sin-coords',
          year: 1900,
          type: 'BATTLE',
          importanceScore: 10,
        },
      ],
    });

  describe('GET /battles', () => {
    it('lista paginada ordenada por importancia con meta', async () => {
      await seed();
      const res = await request(app.getHttpServer())
        .get('/battles?page=1&pageSize=2')
        .expect(200);

      expect(res.body.meta).toMatchObject({ total: 3, page: 1, pageSize: 2 });
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('Batalla de Waterloo'); // score 95
      // No se filtran campos fuera del select (sin wikidataId/promptHash).
      expect(res.body.data[0]).not.toHaveProperty('wikidataId');
    });

    it('filtra por type', async () => {
      await seed();
      const res = await request(app.getHttpServer())
        .get('/battles?type=SIEGE')
        .expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('SIEGE');
    });

    it('búsqueda insensible a mayúsculas', async () => {
      await seed();
      const res = await request(app.getHttpServer())
        .get('/battles?search=waterloo')
        .expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('batalla-de-waterloo');
    });

    it('400 si el rango de años supera 150 sin bbox', async () => {
      await request(app.getHttpServer())
        .get('/battles?yearMin=1000&yearMax=1300')
        .expect(400);
    });
  });

  describe('GET /battles/points', () => {
    it('devuelve solo batallas con coordenadas', async () => {
      await seed();
      const res = await request(app.getHttpServer())
        .get('/battles/points')
        .expect(200);
      expect(res.body).toHaveLength(2); // la sin coords queda fuera
      expect(res.body.every((p: { latitude: number }) => p.latitude != null)).toBe(
        true,
      );
    });

    it('acota por bbox', async () => {
      await seed();
      const res = await request(app.getHttpServer())
        // bbox alrededor de Constantinopla (lat 41, lng 28.97)
        .get('/battles/points?bboxN=42&bboxS=40&bboxE=30&bboxW=28')
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].slug).toBe('asedio-de-constantinopla');
    });
  });

  describe('GET /battles/:id', () => {
    it('resuelve por slug y por id', async () => {
      await seed();
      const bySlug = await request(app.getHttpServer())
        .get('/battles/batalla-de-waterloo')
        .expect(200);
      expect(bySlug.body.name).toBe('Batalla de Waterloo');
      expect(bySlug.body.hasAiStory).toBe(false);

      const byId = await request(app.getHttpServer())
        .get(`/battles/${bySlug.body.id}`)
        .expect(200);
      expect(byId.body.slug).toBe('batalla-de-waterloo');
    });

    it('404 si no existe', async () => {
      await request(app.getHttpServer()).get('/battles/no-existe').expect(404);
    });
  });

  describe('GET /battles/on-this-day', () => {
    it('hace match por -MM-DD contra date y startDate', async () => {
      await prisma.battle.createMany({
        data: [
          {
            name: 'Efeméride por date',
            slug: 'efem-date',
            date: `1812${todayMmdd}`,
            importanceScore: 50,
          },
          {
            name: 'Efeméride por startDate',
            slug: 'efem-start',
            startDate: `1944${todayMmdd}`,
            importanceScore: 40,
          },
          {
            name: 'Otro día',
            slug: 'otro-dia',
            date: '1900-01-01',
            importanceScore: 99,
          },
        ],
      });
      const res = await request(app.getHttpServer())
        .get('/battles/on-this-day')
        .expect(200);
      const slugs = res.body.map((b: { slug: string }) => b.slug);
      expect(slugs).toContain('efem-date');
      expect(slugs).toContain('efem-start');
      expect(slugs).not.toContain('otro-dia');
    });
  });

  describe('GET /battles/stats y /centuries', () => {
    it('agrega totales, tipos y siglos', async () => {
      await seed();
      const stats = await request(app.getHttpServer())
        .get('/battles/stats')
        .expect(200);
      expect(stats.body.total).toBe(3);
      expect(stats.body.withCoords).toBe(2);
      const siege = stats.body.byType.find(
        (t: { type: string }) => t.type === 'SIEGE',
      );
      expect(siege.count).toBe(1);

      const centuries = await request(app.getHttpServer())
        .get('/battles/centuries')
        .expect(200);
      // 1815→s.XIX, 1453→s.XV, 1900→s.XIX
      const c19 = centuries.body.find((c: { century: number }) => c.century === 19);
      expect(c19.count).toBe(2);
    });
  });

  describe('GET /battles/:id/article (backfill perezoso)', () => {
    it('devuelve cached:true sin tocar la red si ya está en BD', async () => {
      await prisma.battle.create({
        data: {
          name: 'Con artículo',
          slug: 'con-articulo',
          article: 'Texto ya cacheado en la BD.',
          wikipediaUrl: 'https://es.wikipedia.org/wiki/X',
        },
      });
      const res = await request(app.getHttpServer())
        .get('/battles/con-articulo/article')
        .expect(200);
      expect(res.body).toMatchObject({ cached: true, article: 'Texto ya cacheado en la BD.' });
      expect(fetchArticleText).not.toHaveBeenCalled();
    });

    it('hace backfill, persiste en la BD real y devuelve cached:false', async () => {
      await prisma.battle.create({
        data: {
          name: 'Sin artículo',
          slug: 'sin-articulo',
          wikipediaUrl: 'https://es.wikipedia.org/wiki/Y',
        },
      });
      fetchArticleText.mockResolvedValue('Artículo recién traído.');

      const res = await request(app.getHttpServer())
        .get('/battles/sin-articulo/article')
        .expect(200);
      expect(res.body).toMatchObject({ cached: false, article: 'Artículo recién traído.' });

      // Comprobamos el write-back en la BD real.
      const row = await prisma.battle.findUnique({
        where: { slug: 'sin-articulo' },
        select: { article: true },
      });
      expect(row?.article).toBe('Artículo recién traído.');
    });
  });

  describe('GET /battles/:id/ai-story', () => {
    it('devuelve la narrativa pre-generada si existe', async () => {
      const battle = await prisma.battle.create({
        data: { name: 'Con IA', slug: 'con-ia' },
      });
      await prisma.battleAISummary.create({
        data: {
          battleId: battle.id,
          summary: 's',
          context: 'c',
          outcome: 'o',
          curiosities: 'cur',
          modelUsed: 'mock',
          promptHash: 'abc',
        },
      });
      const res = await request(app.getHttpServer())
        .get('/battles/con-ia/ai-story')
        .expect(200);
      expect(res.body).toMatchObject({ summary: 's', modelUsed: 'mock' });
    });

    it('devuelve unavailable si no hay narrativa', async () => {
      await prisma.battle.create({ data: { name: 'Sin IA', slug: 'sin-ia' } });
      const res = await request(app.getHttpServer())
        .get('/battles/sin-ia/ai-story')
        .expect(200);
      expect(res.body).toEqual({ status: 'unavailable' });
    });

    it('404 si la batalla no existe', async () => {
      await request(app.getHttpServer())
        .get('/battles/no-existe/ai-story')
        .expect(404);
    });
  });
});
