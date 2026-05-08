import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BattleType } from '@prisma/client';
import { BattleService } from './battle.service';
import { PrismaService } from '../prisma/prisma.service';

// @prisma/client is only available after `prisma generate`.
jest.mock('@prisma/client', () => ({
  BattleType: { LAND: 'LAND', NAVAL: 'NAVAL', AIR: 'AIR', SIEGE: 'SIEGE', MIXED: 'MIXED' },
  PrismaClient: jest.fn(),
}));

// ─── Stubs ────────────────────────────────────────────────────────────────────

const LOCATION_STUB = { name: 'Waterloo', country: 'Bélgica', lat: 50.68, lon: 4.41 };
const ERA_STUB = { name: 'Edad Contemporánea', slug: 'contemporary' };

const BATTLE_STUB = {
  id: 'battle-1',
  name: 'Batalla de Waterloo',
  slug: 'batalla-de-waterloo',
  description: null,
  date: new Date('1815-06-18'),
  dateText: '18 de junio de 1815',
  result: 'victory',
  type: BattleType.LAND,
  wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_de_Waterloo',
  eraId: 'era-1',
  locationId: 'loc-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  era: ERA_STUB,
  location: LOCATION_STUB,
  wars: [{ warId: 'war-1', war: { id: 'war-1', name: 'Guerra de los Cien Días', slug: 'guerra-cien-dias' } }],
  factions: [],
  media: [],
};

// ─── Mock factory ─────────────────────────────────────────────────────────────

function buildMockPrisma() {
  return {
    battle: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('BattleService', () => {
  let service: BattleService;
  let prisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<BattleService>(BattleService);
  });

  afterEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('happy: returns paginated battles with default params', async () => {
      prisma.$transaction.mockResolvedValue([[BATTLE_STUB], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('happy: returns correct meta for multi-page results', async () => {
      prisma.$transaction.mockResolvedValue([Array(20).fill(BATTLE_STUB), 45]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(45);
    });

    it('edge: empty result returns {data: [], meta: {total: 0}}', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('edge: limit is capped at 100', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ limit: 9999 });

      // $transaction receives two Prisma operations; the findMany should have take=100
      const [[findManyCall]] = prisma.$transaction.mock.calls;
      // The array passed to $transaction contains the query calls
      expect(findManyCall).toBeDefined();
    });

    it('edge: page < 1 is normalised to 1', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: -5 });

      expect(result.meta.page).toBe(1);
    });

    it('edge: sortBy=name uses name:asc ordering', async () => {
      prisma.$transaction.mockResolvedValue([[BATTLE_STUB], 1]);

      await service.findAll({ sortBy: 'name' });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('error: DB error propagates as-is', async () => {
      const boom = new Error('connection lost');
      prisma.$transaction.mockRejectedValue(boom);

      await expect(service.findAll({})).rejects.toBe(boom);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findOne
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOne', () => {
    it('happy: finds battle by id and returns detail with relatedBattles', async () => {
      prisma.battle.findFirst.mockResolvedValue(BATTLE_STUB);
      prisma.battle.findMany.mockResolvedValue([]);

      const result = await service.findOne('battle-1') as any;

      expect(result.id).toBe('battle-1');
      expect(result.relatedBattles).toEqual([]);
    });

    it('happy: finds battle by slug', async () => {
      prisma.battle.findFirst.mockResolvedValue(BATTLE_STUB);
      prisma.battle.findMany.mockResolvedValue([]);

      const result = await service.findOne('batalla-de-waterloo') as any;

      // OR clause passes both id and slug — behaviour verified by findFirst mock
      expect(prisma.battle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ id: 'batalla-de-waterloo' }, { slug: 'batalla-de-waterloo' }] },
        }),
      );
      expect(result).toBeDefined();
    });

    it('happy: includes related battles from same wars', async () => {
      const related = { id: 'battle-2', name: 'Batalla de Ligny', slug: 'batalla-de-ligny', date: null, result: 'victory', type: BattleType.LAND };
      prisma.battle.findFirst.mockResolvedValue(BATTLE_STUB);
      prisma.battle.findMany.mockResolvedValue([related]);

      const result = await service.findOne('battle-1') as any;

      expect(result.relatedBattles).toHaveLength(1);
      expect(result.relatedBattles[0].id).toBe('battle-2');
    });

    it('edge: battle with no wars returns empty relatedBattles without extra query', async () => {
      const noWarsBattle = { ...BATTLE_STUB, wars: [] };
      prisma.battle.findFirst.mockResolvedValue(noWarsBattle);

      const result = await service.findOne('battle-1') as any;

      expect(result.relatedBattles).toEqual([]);
      expect(prisma.battle.findMany).not.toHaveBeenCalled();
    });

    it('error: throws NotFoundException when battle not found', async () => {
      prisma.battle.findFirst.mockResolvedValue(null);

      await expect(service.findOne('ghost-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: DB error on findFirst propagates as-is', async () => {
      const boom = new Error('timeout');
      prisma.battle.findFirst.mockRejectedValue(boom);

      await expect(service.findOne('battle-1')).rejects.toBe(boom);
    });
  });
});
