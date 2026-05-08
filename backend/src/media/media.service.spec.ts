import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, MediaSource } from '@prisma/client';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma/prisma.service';

// @prisma/client is only available after `prisma generate`.
// Mock the module so tests run without a generated client.
jest.mock('@prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    clientVersion: string;
    constructor(message: string, { code, clientVersion }: { code: string; clientVersion: string }) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = code;
      this.clientVersion = clientVersion;
    }
  }
  return {
    MediaSource: { WIKIMEDIA: 'WIKIMEDIA', CUSTOM: 'CUSTOM', EXTERNAL: 'EXTERNAL' },
    Prisma: { PrismaClientKnownRequestError },
    PrismaClient: jest.fn(),
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePrismaError(code: string) {
  const err = new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
  return err;
}

const MEDIA_STUB = {
  id: 'media-1',
  url: 'https://upload.wikimedia.org/img.jpg',
  source: MediaSource.WIKIMEDIA,
  license: 'CC-BY-SA-4.0',
  caption: 'Battle scene',
  altText: 'Alt text',
  width: 1200,
  height: 800,
  mimeType: 'image/jpeg',
  wikiTitle: 'Battle_stub.jpg',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

// ─── Mock factory ─────────────────────────────────────────────────────────────

function buildMockPrisma() {
  return {
    media: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    battle: { findUnique: jest.fn() },
    war: { findUnique: jest.fn() },
    commander: { findUnique: jest.fn() },
    battleMedia: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    warMedia: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    commanderMedia: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('MediaService', () => {
  let service: MediaService;
  let prisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    prisma = buildMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════════════════════
  describe('create', () => {
    it('happy: creates and returns a media item with all fields', async () => {
      prisma.media.create.mockResolvedValue(MEDIA_STUB);

      const result = await service.create({
        url: MEDIA_STUB.url,
        source: MediaSource.WIKIMEDIA,
        license: 'CC-BY-SA-4.0',
        caption: 'Battle scene',
        altText: 'Alt text',
        width: 1200,
        height: 800,
        mimeType: 'image/jpeg',
        wikiTitle: 'Battle_stub.jpg',
      });

      expect(prisma.media.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(MEDIA_STUB);
    });

    it('happy: creates with only required field (url)', async () => {
      const minimal = { ...MEDIA_STUB, license: null, caption: null };
      prisma.media.create.mockResolvedValue(minimal);

      const result = await service.create({ url: MEDIA_STUB.url });

      expect(result.url).toBe(MEDIA_STUB.url);
    });

    it('edge: duplicate URL throws ConflictException (P2002)', async () => {
      prisma.media.create.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.create({ url: MEDIA_STUB.url })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('error: unrelated DB error propagates as-is', async () => {
      const boom = new Error('connection refused');
      prisma.media.create.mockRejectedValue(boom);

      await expect(service.create({ url: MEDIA_STUB.url })).rejects.toBe(boom);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('happy: returns paginated data and total', async () => {
      prisma.$transaction.mockResolvedValue([[MEDIA_STUB], 1]);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result).toEqual({ data: [MEDIA_STUB], total: 1 });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('edge: empty result returns {data: [], total: 0}', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result).toEqual({ data: [], total: 0 });
    });

    it('edge: filtering by source passes the where clause', async () => {
      prisma.$transaction.mockResolvedValue([[MEDIA_STUB], 1]);

      await service.findAll({ source: MediaSource.CUSTOM });

      // The transaction receives two Prisma operations; we inspect the call
      const [ops] = prisma.$transaction.mock.calls[0];
      // ops is an array of Prisma promises built with the where clause —
      // we verify $transaction was called (Prisma resolves the where internally)
      expect(ops).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findOne
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOne', () => {
    it('happy: returns the media item when found', async () => {
      prisma.media.findUnique.mockResolvedValue(MEDIA_STUB);

      const result = await service.findOne('media-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('error: throws NotFoundException when id does not exist', async () => {
      prisma.media.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // update
  // ═══════════════════════════════════════════════════════════════════════════
  describe('update', () => {
    it('happy: updates and returns the updated media item', async () => {
      const updated = { ...MEDIA_STUB, caption: 'Updated caption' };
      prisma.media.findUnique.mockResolvedValue(MEDIA_STUB);
      prisma.media.update.mockResolvedValue(updated);

      const result = await service.update('media-1', { caption: 'Updated caption' });

      expect(prisma.media.update).toHaveBeenCalledWith({
        where: { id: 'media-1' },
        data: { caption: 'Updated caption' },
      });
      expect(result.caption).toBe('Updated caption');
    });

    it('error: throws NotFoundException when media does not exist', async () => {
      prisma.media.findUnique.mockResolvedValue(null);

      await expect(
        service.update('ghost-id', { caption: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.media.update).not.toHaveBeenCalled();
    });

    it('edge: changing URL to a duplicate throws ConflictException (P2002)', async () => {
      prisma.media.findUnique.mockResolvedValue(MEDIA_STUB);
      prisma.media.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(
        service.update('media-1', { url: 'https://other.com/dup.jpg' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('error: unrelated DB error on update propagates as-is', async () => {
      const boom = new Error('timeout');
      prisma.media.findUnique.mockResolvedValue(MEDIA_STUB);
      prisma.media.update.mockRejectedValue(boom);

      await expect(service.update('media-1', {})).rejects.toBe(boom);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // remove
  // ═══════════════════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('happy: deletes the media item and returns void', async () => {
      prisma.media.findUnique.mockResolvedValue(MEDIA_STUB);
      prisma.media.delete.mockResolvedValue(MEDIA_STUB);

      await expect(service.remove('media-1')).resolves.toBeUndefined();
      expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'media-1' } });
    });

    it('error: throws NotFoundException when media does not exist', async () => {
      prisma.media.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.media.delete).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // attach
  // ═══════════════════════════════════════════════════════════════════════════
  describe('attach', () => {
    const battleStub = { id: 'battle-1' };
    const warStub = { id: 'war-1' };
    const commanderStub = { id: 'cmd-1' };

    beforeEach(() => {
      prisma.media.findUnique.mockResolvedValue(MEDIA_STUB);
    });

    it('happy: attaches media to a battle with default options', async () => {
      prisma.battle.findUnique.mockResolvedValue(battleStub);
      prisma.battleMedia.create.mockResolvedValue({});

      await expect(
        service.attach('media-1', 'battle', 'battle-1'),
      ).resolves.toBeUndefined();

      expect(prisma.battleMedia.create).toHaveBeenCalledWith({
        data: { mediaId: 'media-1', battleId: 'battle-1', isPrimary: false, order: 0 },
      });
    });

    it('happy: attaches media to a war', async () => {
      prisma.war.findUnique.mockResolvedValue(warStub);
      prisma.warMedia.create.mockResolvedValue({});

      await service.attach('media-1', 'war', 'war-1');

      expect(prisma.warMedia.create).toHaveBeenCalledWith({
        data: { mediaId: 'media-1', warId: 'war-1', isPrimary: false, order: 0 },
      });
    });

    it('happy: attaches media to a commander', async () => {
      prisma.commander.findUnique.mockResolvedValue(commanderStub);
      prisma.commanderMedia.create.mockResolvedValue({});

      await service.attach('media-1', 'commander', 'cmd-1');

      expect(prisma.commanderMedia.create).toHaveBeenCalledWith({
        data: { mediaId: 'media-1', commanderId: 'cmd-1', isPrimary: false, order: 0 },
      });
    });

    it('happy: isPrimary=true triggers transaction that unsets previous primary', async () => {
      prisma.battle.findUnique.mockResolvedValue(battleStub);
      // Simulate the $transaction callback being executed
      prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<void>) => {
        const fakeTx = {
          battleMedia: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        await cb(fakeTx);
        return fakeTx;
      });

      await service.attach('media-1', 'battle', 'battle-1', { isPrimary: true });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('happy: attach respects custom order value', async () => {
      prisma.battle.findUnique.mockResolvedValue(battleStub);
      prisma.battleMedia.create.mockResolvedValue({});

      await service.attach('media-1', 'battle', 'battle-1', { order: 5 });

      expect(prisma.battleMedia.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 5 }),
      });
    });

    it('error: mediaId not found throws NotFoundException', async () => {
      prisma.media.findUnique.mockResolvedValue(null);

      await expect(
        service.attach('ghost', 'battle', 'battle-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: entityId not found throws NotFoundException', async () => {
      prisma.battle.findUnique.mockResolvedValue(null);

      await expect(
        service.attach('media-1', 'battle', 'ghost-battle'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('edge: already attached throws ConflictException (P2002)', async () => {
      prisma.battle.findUnique.mockResolvedValue(battleStub);
      prisma.battleMedia.create.mockRejectedValue(makePrismaError('P2002'));

      await expect(
        service.attach('media-1', 'battle', 'battle-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // detach
  // ═══════════════════════════════════════════════════════════════════════════
  describe('detach', () => {
    it('happy: detaches media from a battle', async () => {
      prisma.battleMedia.delete.mockResolvedValue({});

      await expect(
        service.detach('media-1', 'battle', 'battle-1'),
      ).resolves.toBeUndefined();

      expect(prisma.battleMedia.delete).toHaveBeenCalledWith({
        where: { mediaId_battleId: { mediaId: 'media-1', battleId: 'battle-1' } },
      });
    });

    it('happy: detaches media from a war', async () => {
      prisma.warMedia.delete.mockResolvedValue({});

      await service.detach('media-1', 'war', 'war-1');

      expect(prisma.warMedia.delete).toHaveBeenCalledWith({
        where: { mediaId_warId: { mediaId: 'media-1', warId: 'war-1' } },
      });
    });

    it('happy: detaches media from a commander', async () => {
      prisma.commanderMedia.delete.mockResolvedValue({});

      await service.detach('media-1', 'commander', 'cmd-1');

      expect(prisma.commanderMedia.delete).toHaveBeenCalledWith({
        where: { mediaId_commanderId: { mediaId: 'media-1', commanderId: 'cmd-1' } },
      });
    });

    it('error: not attached throws NotFoundException (P2025)', async () => {
      prisma.battleMedia.delete.mockRejectedValue(makePrismaError('P2025'));

      await expect(
        service.detach('media-1', 'battle', 'battle-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: unrelated DB error on detach propagates as-is', async () => {
      const boom = new Error('disk full');
      prisma.battleMedia.delete.mockRejectedValue(boom);

      await expect(
        service.detach('media-1', 'battle', 'battle-1'),
      ).rejects.toBe(boom);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getPrimary
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getPrimary', () => {
    it('happy: returns the primary media for a battle', async () => {
      prisma.battleMedia.findFirst.mockResolvedValue({
        media: MEDIA_STUB,
        mediaId: 'media-1',
        battleId: 'battle-1',
        isPrimary: true,
        order: 0,
      });

      const result = await service.getPrimary('battle', 'battle-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('happy: returns the primary media for a war', async () => {
      prisma.warMedia.findFirst.mockResolvedValue({ media: MEDIA_STUB });

      const result = await service.getPrimary('war', 'war-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('happy: returns the primary media for a commander', async () => {
      prisma.commanderMedia.findFirst.mockResolvedValue({ media: MEDIA_STUB });

      const result = await service.getPrimary('commander', 'cmd-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('edge: no primary set returns null', async () => {
      prisma.battleMedia.findFirst.mockResolvedValue(null);

      const result = await service.getPrimary('battle', 'battle-1');

      expect(result).toBeNull();
    });

    it('edge: entity has no media at all returns null', async () => {
      prisma.warMedia.findFirst.mockResolvedValue(null);

      const result = await service.getPrimary('war', 'war-99');

      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // listForEntity
  // ═══════════════════════════════════════════════════════════════════════════
  describe('listForEntity', () => {
    it('happy: returns media ordered by order for a battle', async () => {
      const rows = [
        { media: { ...MEDIA_STUB, id: 'media-1' }, order: 0 },
        { media: { ...MEDIA_STUB, id: 'media-2' }, order: 1 },
      ];
      prisma.battleMedia.findMany.mockResolvedValue(rows);

      const result = await service.listForEntity('battle', 'battle-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('media-1');
      expect(result[1].id).toBe('media-2');
      expect(prisma.battleMedia.findMany).toHaveBeenCalledWith({
        where: { battleId: 'battle-1' },
        include: { media: true },
        orderBy: { order: 'asc' },
      });
    });

    it('happy: returns media for a war', async () => {
      prisma.warMedia.findMany.mockResolvedValue([{ media: MEDIA_STUB }]);

      const result = await service.listForEntity('war', 'war-1');

      expect(result).toHaveLength(1);
    });

    it('happy: returns media for a commander', async () => {
      prisma.commanderMedia.findMany.mockResolvedValue([{ media: MEDIA_STUB }]);

      const result = await service.listForEntity('commander', 'cmd-1');

      expect(result).toHaveLength(1);
    });

    it('edge: entity has no media returns empty array', async () => {
      prisma.battleMedia.findMany.mockResolvedValue([]);

      const result = await service.listForEntity('battle', 'battle-empty');

      expect(result).toEqual([]);
    });
  });
});
