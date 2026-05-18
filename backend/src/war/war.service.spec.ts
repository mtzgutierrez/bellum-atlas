import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WarService } from './war.service';
import { WarRepository } from './war.repository';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const WAR_STUB = {
  id: 'war-1',
  name: 'Guerras Napoleónicas',
  slug: 'guerras-napoleonicas',
  description: 'Serie de conflictos...',
  startDate: new Date('1803-05-18'),
  endDate: new Date('1815-11-20'),
  result: 'Victoria de la Séptima Coalición',
  wikipediaUrl: 'https://es.wikipedia.org/wiki/Guerras_napole%C3%B3nicas',
  eraId: 'era-1',
  locationId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  era: { name: 'Edad Contemporánea', slug: 'contemporary' },
  location: null,
  factions: [],
  battles: [
    {
      battleId: 'b-1',
      warId: 'war-1',
      battle: { id: 'b-1', name: 'Batalla de Waterloo', slug: 'batalla-de-waterloo', date: new Date('1815-06-18'), result: 'victory', type: 'LAND' },
    },
  ],
  media: [],
};

function buildMockRepository() {
  return {
    findAll: jest.fn(),
    findByIdOrSlug: jest.fn(),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('WarService', () => {
  let service: WarService;
  let repo: ReturnType<typeof buildMockRepository>;

  beforeEach(async () => {
    repo = buildMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [WarService, { provide: WarRepository, useValue: repo }],
    }).compile();
    service = module.get<WarService>(WarService);
  });

  afterEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('happy: returns paginated wars', async () => {
      repo.findAll.mockResolvedValue([[WAR_STUB], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('edge: empty result', async () => {
      repo.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('edge: q filter is forwarded to repository', async () => {
      repo.findAll.mockResolvedValue([[WAR_STUB], 1]);

      await service.findAll({ q: 'Napoleon' });

      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });

    it('edge: pagination is normalised', async () => {
      repo.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 3, limit: 5 });

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(5);
    });

    it('error: DB error propagates', async () => {
      repo.findAll.mockRejectedValue(new Error('timeout'));

      await expect(service.findAll({})).rejects.toThrow('timeout');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findOne
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOne', () => {
    it('happy: returns war with stats computed from dates', async () => {
      repo.findByIdOrSlug.mockResolvedValue(WAR_STUB);

      const result = await service.findOne('war-1') as any;

      expect(result.id).toBe('war-1');
      expect(result.stats.totalBattles).toBe(1);
      // 1803-05-18 to 1815-11-20 ≈ 4568 days
      expect(result.stats.durationDays).toBeGreaterThan(4000);
    });

    it('happy: accepts slug', async () => {
      repo.findByIdOrSlug.mockResolvedValue(WAR_STUB);

      await service.findOne('guerras-napoleonicas');

      expect(repo.findByIdOrSlug).toHaveBeenCalledWith('guerras-napoleonicas');
    });

    it('edge: durationDays is null when dates are missing', async () => {
      repo.findByIdOrSlug.mockResolvedValue({ ...WAR_STUB, startDate: null, endDate: null });

      const result = await service.findOne('war-1') as any;

      expect(result.stats.durationDays).toBeNull();
    });

    it('edge: totalBattles is 0 when no battles linked', async () => {
      repo.findByIdOrSlug.mockResolvedValue({ ...WAR_STUB, battles: [] });

      const result = await service.findOne('war-1') as any;

      expect(result.stats.totalBattles).toBe(0);
    });

    it('error: throws NotFoundException when war not found', async () => {
      repo.findByIdOrSlug.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: DB error propagates', async () => {
      repo.findByIdOrSlug.mockRejectedValue(new Error('boom'));

      await expect(service.findOne('war-1')).rejects.toThrow('boom');
    });
  });
});
