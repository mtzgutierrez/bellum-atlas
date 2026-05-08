import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaSource } from '@prisma/client';

// @prisma/client is only available after `prisma generate`.
// Mock the module so tests run without a generated client.
jest.mock('@prisma/client', () => ({
  MediaSource: { WIKIMEDIA: 'WIKIMEDIA', CUSTOM: 'CUSTOM', EXTERNAL: 'EXTERNAL' },
  PrismaClient: jest.fn(),
}));

// ─── Stubs ────────────────────────────────────────────────────────────────────

const BASE_DTO = {
  type: 'battle',
  title: 'Batalla de Waterloo',
  wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_de_Waterloo',
  dateText: '18 de junio de 1815',
  date: '1815-06-18',
  place: 'Waterloo, Bélgica',
  coordinates: { lat: 50.68, lon: 4.41 },
  result: 'Victoria de la Séptima Coalición',
  belligerents: { side1: 'Séptima Coalición', side2: 'Imperio Francés' },
  commanders: { side1: 'Wellington | Blücher', side2: 'Napoleón' },
  strength: { side1: '118.000', side2: '72.000' },
  casualties: { side1: '22.000', side2: '41.000' },
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/Battle_of_Waterloo.jpg',
};

const BATTLE_RESULT = { id: 'battle-1', slug: 'batalla-de-waterloo', name: 'Batalla de Waterloo' };

// ─── Mock factory ─────────────────────────────────────────────────────────────

function buildTx() {
  return {
    location: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    battle: { findUnique: jest.fn(), upsert: jest.fn(), findFirst: jest.fn() },
    battleFaction: { upsert: jest.fn() },
    commander: { findFirst: jest.fn(), create: jest.fn() },
    commanderBattleFaction: { create: jest.fn() },
    media: { upsert: jest.fn() },
    battleMedia: { updateMany: jest.fn(), upsert: jest.fn() },
  };
}

function buildMockPrisma() {
  return { $transaction: jest.fn() };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ScraperService', () => {
  let service: ScraperService;
  let prisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScraperService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ScraperService>(ScraperService);
  });

  afterEach(() => jest.clearAllMocks());

  // Helper: runs $transaction callback with the given tx mock
  function mockTransaction(tx: ReturnType<typeof buildTx>) {
    prisma.$transaction.mockImplementation((cb: (tx: any) => Promise<any>) => cb(tx));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // upsertBattle — happy paths
  // ═══════════════════════════════════════════════════════════════════════════
  describe('upsertBattle — happy paths', () => {
    it('creates a new battle with all fields (location, factions, commanders, media)', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      // Location: new
      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1', name: 'Waterloo', country: 'Bélgica', lat: 50.68, lon: 4.41 });

      // Battle: new (no existing)
      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null); // slug uniqueness check
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);

      // Factions
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1', side: 1, battleId: 'battle-1' });

      // Commanders: Wellington → new, Blücher → new, Napoleón → new
      tx.commander.findFirst.mockResolvedValue(null);
      tx.commander.create.mockResolvedValueOnce({ id: 'cmd-1', name: 'Wellington' })
        .mockResolvedValueOnce({ id: 'cmd-2', name: 'Blücher' })
        .mockResolvedValueOnce({ id: 'cmd-3', name: 'Napoleón' });
      tx.commanderBattleFaction.create.mockResolvedValue({});

      // Media
      tx.media.upsert.mockResolvedValue({ id: 'media-1', url: BASE_DTO.imageUrl });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 0 });
      tx.battleMedia.upsert.mockResolvedValue({});

      const result = await service.upsertBattle(BASE_DTO);

      expect(result).toEqual(BATTLE_RESULT);
      expect(tx.location.create).toHaveBeenCalledTimes(1);
      expect(tx.battle.upsert).toHaveBeenCalledTimes(1);
      expect(tx.battleFaction.upsert).toHaveBeenCalledTimes(2); // side 1 + side 2
      expect(tx.commander.create).toHaveBeenCalledTimes(3); // Wellington, Blücher, Napoleón
      expect(tx.media.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ source: MediaSource.WIKIMEDIA }) }),
      );
    });

    it('updates an existing battle keeping the original slug', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      // Location: existing
      tx.location.findFirst.mockResolvedValue({ id: 'loc-1', name: 'Waterloo', country: 'Bélgica', lat: 50.68, lon: 4.41 });
      tx.location.update.mockResolvedValue({ id: 'loc-1' });

      // Battle: existing — slug preserved
      tx.battle.findUnique.mockResolvedValue({ id: 'battle-1', slug: 'original-slug' });
      tx.battle.upsert.mockResolvedValue({ id: 'battle-1', slug: 'original-slug', name: 'Batalla de Waterloo' });

      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1', side: 1, battleId: 'battle-1' });
      tx.commander.findFirst.mockResolvedValue({ id: 'cmd-1', name: 'Wellington' });
      tx.commander.create.mockResolvedValue({ id: 'cmd-2', name: 'Blücher' });
      tx.commanderBattleFaction.create.mockResolvedValue({});
      tx.media.upsert.mockResolvedValue({ id: 'media-1', url: BASE_DTO.imageUrl });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 0 });
      tx.battleMedia.upsert.mockResolvedValue({});

      const result = await service.upsertBattle(BASE_DTO) as any;

      // Slug must be the existing one, not regenerated
      expect(result.slug).toBe('original-slug');
      expect(tx.battle.findFirst).not.toHaveBeenCalled(); // no slug uniqueness check needed
    });

    it('reuses existing location and updates coordinates', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue({ id: 'loc-1', name: 'Waterloo', country: 'Bélgica', lat: 50.0, lon: 4.0 });
      tx.location.update.mockResolvedValue({ id: 'loc-1', lat: 50.68, lon: 4.41 });
      tx.battle.findUnique.mockResolvedValue({ id: 'battle-1', slug: 'batalla-de-waterloo' });
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });
      tx.commander.findFirst.mockResolvedValue({ id: 'cmd-1', name: 'Wellington' });
      tx.commanderBattleFaction.create.mockResolvedValue({});
      tx.media.upsert.mockResolvedValue({ id: 'media-1' });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 0 });
      tx.battleMedia.upsert.mockResolvedValue({});

      await service.upsertBattle(BASE_DTO);

      expect(tx.location.create).not.toHaveBeenCalled();
      expect(tx.location.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { lat: 50.68, lon: 4.41 } }),
      );
    });

    it('reuses an existing commander instead of creating a duplicate', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1' });
      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null);
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });

      // Wellington already exists in DB
      tx.commander.findFirst.mockResolvedValueOnce({ id: 'cmd-existing', name: 'Wellington' });
      tx.commanderBattleFaction.create.mockResolvedValue({});
      tx.media.upsert.mockResolvedValue({ id: 'media-1' });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 0 });
      tx.battleMedia.upsert.mockResolvedValue({});

      await service.upsertBattle({ ...BASE_DTO, commanders: { side1: 'Wellington' }, belligerents: {} });

      expect(tx.commander.create).not.toHaveBeenCalled();
      expect(tx.commanderBattleFaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ commanderId: 'cmd-existing' }) }),
      );
    });

    it('sets media as primary and unsets previous primary', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1' });
      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null);
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });
      tx.commander.findFirst.mockResolvedValue(null);
      tx.commander.create.mockResolvedValue({ id: 'cmd-1' });
      tx.commanderBattleFaction.create.mockResolvedValue({});
      tx.media.upsert.mockResolvedValue({ id: 'media-1' });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 1 }); // 1 previous primary unset
      tx.battleMedia.upsert.mockResolvedValue({});

      await service.upsertBattle(BASE_DTO);

      expect(tx.battleMedia.updateMany).toHaveBeenCalledWith({
        where: { battleId: 'battle-1', isPrimary: true },
        data: { isPrimary: false },
      });
      expect(tx.battleMedia.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ isPrimary: true }) }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // upsertBattle — edge cases
  // ═══════════════════════════════════════════════════════════════════════════
  describe('upsertBattle — edge cases', () => {
    it('skips location creation when place is absent', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null);
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });
      tx.commander.findFirst.mockResolvedValue(null);
      tx.commander.create.mockResolvedValue({ id: 'cmd-1' });
      tx.commanderBattleFaction.create.mockResolvedValue({});

      const { place, coordinates, imageUrl, ...dto } = BASE_DTO;

      await service.upsertBattle(dto);

      expect(tx.location.findFirst).not.toHaveBeenCalled();
      expect(tx.location.create).not.toHaveBeenCalled();
    });

    it('skips media creation when imageUrl is absent', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1' });
      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null);
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });
      tx.commander.findFirst.mockResolvedValue(null);
      tx.commander.create.mockResolvedValue({ id: 'cmd-1' });
      tx.commanderBattleFaction.create.mockResolvedValue({});

      const { imageUrl, ...dto } = BASE_DTO;

      await service.upsertBattle(dto);

      expect(tx.media.upsert).not.toHaveBeenCalled();
    });

    it('adds suffix to slug when base slug is already taken', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1' });
      tx.battle.findUnique.mockResolvedValue(null); // no existing by URL
      // First slug attempt taken, second free
      tx.battle.findFirst
        .mockResolvedValueOnce({ id: 'other-battle' }) // 'batalla-de-waterloo' taken
        .mockResolvedValueOnce(null); // 'batalla-de-waterloo-2' free

      tx.battle.upsert.mockImplementation(({ create }) =>
        Promise.resolve({ id: 'battle-new', slug: create.slug, name: create.name }),
      );
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });
      tx.commander.findFirst.mockResolvedValue(null);
      tx.commander.create.mockResolvedValue({ id: 'cmd-1' });
      tx.commanderBattleFaction.create.mockResolvedValue({});
      tx.media.upsert.mockResolvedValue({ id: 'media-1' });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 0 });
      tx.battleMedia.upsert.mockResolvedValue({});

      const result = await service.upsertBattle(BASE_DTO) as any;

      expect(result.slug).toBe('batalla-de-waterloo-2');
    });

    it('stores null date when date string is invalid', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1' });
      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null);
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });
      tx.commander.findFirst.mockResolvedValue(null);
      tx.commander.create.mockResolvedValue({ id: 'cmd-1' });
      tx.commanderBattleFaction.create.mockResolvedValue({});
      tx.media.upsert.mockResolvedValue({ id: 'media-1' });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 0 });
      tx.battleMedia.upsert.mockResolvedValue({});

      await service.upsertBattle({ ...BASE_DTO, date: 'not-a-date' });

      expect(tx.battle.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ date: null }) }),
      );
    });

    it('ignores duplicate commander-faction link (swallows P2002)', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1' });
      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null);
      tx.battle.upsert.mockResolvedValue(BATTLE_RESULT);
      tx.battleFaction.upsert.mockResolvedValue({ id: 'bf-1' });
      tx.commander.findFirst.mockResolvedValue({ id: 'cmd-1', name: 'Wellington' });
      // Simulate already-linked commander raising a unique constraint error
      tx.commanderBattleFaction.create.mockRejectedValue(new Error('unique constraint'));
      tx.media.upsert.mockResolvedValue({ id: 'media-1' });
      tx.battleMedia.updateMany.mockResolvedValue({ count: 0 });
      tx.battleMedia.upsert.mockResolvedValue({});

      // Should not throw
      await expect(
        service.upsertBattle({ ...BASE_DTO, commanders: { side1: 'Wellington' } }),
      ).resolves.toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // upsertBattle — error cases
  // ═══════════════════════════════════════════════════════════════════════════
  describe('upsertBattle — error cases', () => {
    it('propagates transaction errors as-is', async () => {
      const boom = new Error('database unreachable');
      prisma.$transaction.mockRejectedValue(boom);

      await expect(service.upsertBattle(BASE_DTO)).rejects.toBe(boom);
    });

    it('propagates battle upsert error from inside the transaction', async () => {
      const tx = buildTx();
      mockTransaction(tx);

      tx.location.findFirst.mockResolvedValue(null);
      tx.location.create.mockResolvedValue({ id: 'loc-1' });
      tx.battle.findUnique.mockResolvedValue(null);
      tx.battle.findFirst.mockResolvedValue(null);
      tx.battle.upsert.mockRejectedValue(new Error('constraint violation'));

      await expect(service.upsertBattle(BASE_DTO)).rejects.toThrow('constraint violation');
    });
  });
});
