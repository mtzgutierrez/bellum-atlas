import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommanderService } from './commander.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const COMMANDER_STUB = {
  id: 'cmd-1',
  name: 'Arthur Wellesley',
  country: 'Reino Unido',
  birthYear: 1769,
  deathYear: 1852,
  description: null,
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Duke_of_Wellington',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  battles: [
    {
      commanderId: 'cmd-1',
      battleFactionId: 'bf-1',
      battleFaction: {
        result: 'victory',
        side: 1,
        battle: { id: 'b-1', name: 'Batalla de Waterloo', slug: 'batalla-de-waterloo', date: new Date('1815-06-18'), type: 'LAND' },
      },
    },
    {
      commanderId: 'cmd-1',
      battleFactionId: 'bf-2',
      battleFaction: {
        result: 'victory',
        side: 1,
        battle: { id: 'b-2', name: 'Batalla de Salamanca', slug: 'batalla-de-salamanca', date: new Date('1812-07-22'), type: 'LAND' },
      },
    },
    {
      commanderId: 'cmd-1',
      battleFactionId: 'bf-3',
      battleFaction: {
        result: 'defeat',
        side: 1,
        battle: { id: 'b-3', name: 'Batalla de Bergen op Zoom', slug: 'batalla-de-bergen', date: new Date('1814-03-08'), type: 'LAND' },
      },
    },
  ],
  wars: [],
  media: [],
};

function buildMockPrisma() {
  return {
    commander: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('CommanderService', () => {
  let service: CommanderService;
  let prisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommanderService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<CommanderService>(CommanderService);
  });

  afterEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('happy: returns paginated commanders', async () => {
      prisma.$transaction.mockResolvedValue([[COMMANDER_STUB], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('edge: empty result', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
    });

    it('edge: q filter is applied', async () => {
      prisma.$transaction.mockResolvedValue([[COMMANDER_STUB], 1]);

      await service.findAll({ q: 'Wellington' });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('error: DB error propagates', async () => {
      prisma.$transaction.mockRejectedValue(new Error('db'));

      await expect(service.findAll({})).rejects.toThrow('db');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findOne
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOne', () => {
    it('happy: returns commander with flat battle history', async () => {
      prisma.commander.findUnique.mockResolvedValue(COMMANDER_STUB);

      const result = await service.findOne('cmd-1') as any;

      expect(result.id).toBe('cmd-1');
      expect(result.battles).toHaveLength(3);
      expect(result.battles[0]).toMatchObject({
        id: 'b-1',
        personalResult: 'victory',
        side: 1,
      });
    });

    it('happy: computes win rate correctly (2/3 ≈ 0.67)', async () => {
      prisma.commander.findUnique.mockResolvedValue(COMMANDER_STUB);

      const result = await service.findOne('cmd-1') as any;

      expect(result.stats.total).toBe(3);
      expect(result.stats.victories).toBe(2);
      expect(result.stats.winRate).toBeCloseTo(0.67);
    });

    it('edge: commander with no battles has winRate 0', async () => {
      const noBattles = { ...COMMANDER_STUB, battles: [] };
      prisma.commander.findUnique.mockResolvedValue(noBattles);

      const result = await service.findOne('cmd-1') as any;

      expect(result.stats.total).toBe(0);
      expect(result.stats.victories).toBe(0);
      expect(result.stats.winRate).toBe(0);
    });

    it('edge: commander with all victories has winRate 1', async () => {
      const allWins = {
        ...COMMANDER_STUB,
        battles: COMMANDER_STUB.battles
          .slice(0, 2)
          .map((b) => ({ ...b, battleFaction: { ...b.battleFaction, result: 'victory' } })),
      };
      prisma.commander.findUnique.mockResolvedValue(allWins);

      const result = await service.findOne('cmd-1') as any;

      expect(result.stats.winRate).toBe(1);
    });

    it('error: throws NotFoundException when commander not found', async () => {
      prisma.commander.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: DB error propagates', async () => {
      prisma.commander.findUnique.mockRejectedValue(new Error('timeout'));

      await expect(service.findOne('cmd-1')).rejects.toThrow('timeout');
    });
  });
});
