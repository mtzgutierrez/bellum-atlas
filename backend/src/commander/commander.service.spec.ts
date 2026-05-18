import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommanderService } from './commander.service';
import { CommanderRepository } from './commander.repository';

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

// ─── Mock factory ─────────────────────────────────────────────────────────────

function buildMockRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('CommanderService', () => {
  let service: CommanderService;
  let repo: ReturnType<typeof buildMockRepository>;

  beforeEach(async () => {
    repo = buildMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommanderService, { provide: CommanderRepository, useValue: repo }],
    }).compile();
    service = module.get<CommanderService>(CommanderService);
  });

  afterEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('happy: returns paginated commanders', async () => {
      repo.findAll.mockResolvedValue([[COMMANDER_STUB], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('edge: empty result', async () => {
      repo.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
    });

    it('edge: q filter is applied', async () => {
      repo.findAll.mockResolvedValue([[COMMANDER_STUB], 1]);

      await service.findAll({ q: 'Wellington' });

      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });

    it('error: DB error propagates', async () => {
      repo.findAll.mockRejectedValue(new Error('db'));

      await expect(service.findAll({})).rejects.toThrow('db');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findOne
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOne', () => {
    it('happy: returns commander with flat battle history', async () => {
      repo.findById.mockResolvedValue(COMMANDER_STUB);

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
      repo.findById.mockResolvedValue(COMMANDER_STUB);

      const result = await service.findOne('cmd-1') as any;

      expect(result.stats.total).toBe(3);
      expect(result.stats.victories).toBe(2);
      expect(result.stats.winRate).toBeCloseTo(0.67);
    });

    it('edge: commander with no battles has winRate 0', async () => {
      repo.findById.mockResolvedValue({ ...COMMANDER_STUB, battles: [] });

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
      repo.findById.mockResolvedValue(allWins);

      const result = await service.findOne('cmd-1') as any;

      expect(result.stats.winRate).toBe(1);
    });

    it('error: throws NotFoundException when commander not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: DB error propagates', async () => {
      repo.findById.mockRejectedValue(new Error('timeout'));

      await expect(service.findOne('cmd-1')).rejects.toThrow('timeout');
    });
  });
});
