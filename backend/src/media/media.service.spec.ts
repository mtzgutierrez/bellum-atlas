import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, MediaSource } from '@prisma/client';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';

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
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
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

function buildMockRepository() {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findEntityById: jest.fn(),
    attach: jest.fn(),
    detach: jest.fn(),
    findPrimaryRow: jest.fn(),
    findAllForEntity: jest.fn(),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('MediaService', () => {
  let service: MediaService;
  let repo: ReturnType<typeof buildMockRepository>;

  beforeEach(async () => {
    repo = buildMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: MediaRepository, useValue: repo },
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
      repo.create.mockResolvedValue(MEDIA_STUB);

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

      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(MEDIA_STUB);
    });

    it('happy: creates with only required field (url)', async () => {
      const minimal = { ...MEDIA_STUB, license: null, caption: null };
      repo.create.mockResolvedValue(minimal);

      const result = await service.create({ url: MEDIA_STUB.url });

      expect(result.url).toBe(MEDIA_STUB.url);
    });

    it('edge: duplicate URL throws ConflictException (P2002)', async () => {
      repo.create.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.create({ url: MEDIA_STUB.url })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('error: unrelated DB error propagates as-is', async () => {
      const boom = new Error('connection refused');
      repo.create.mockRejectedValue(boom);

      await expect(service.create({ url: MEDIA_STUB.url })).rejects.toBe(boom);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('happy: returns paginated data and total', async () => {
      repo.findAll.mockResolvedValue([[MEDIA_STUB], 1]);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result).toEqual({ data: [MEDIA_STUB], total: 1 });
      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });

    it('edge: empty result returns {data: [], total: 0}', async () => {
      repo.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result).toEqual({ data: [], total: 0 });
    });

    it('edge: filtering by source is forwarded to repository', async () => {
      repo.findAll.mockResolvedValue([[MEDIA_STUB], 1]);

      await service.findAll({ source: MediaSource.CUSTOM });

      expect(repo.findAll).toHaveBeenCalledWith(MediaSource.CUSTOM, 0, 20);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findOne
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOne', () => {
    it('happy: returns the media item when found', async () => {
      repo.findById.mockResolvedValue(MEDIA_STUB);

      const result = await service.findOne('media-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('error: throws NotFoundException when id does not exist', async () => {
      repo.findById.mockResolvedValue(null);

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
      repo.findById.mockResolvedValue(MEDIA_STUB);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('media-1', { caption: 'Updated caption' });

      expect(repo.update).toHaveBeenCalledWith('media-1', { caption: 'Updated caption' });
      expect(result.caption).toBe('Updated caption');
    });

    it('error: throws NotFoundException when media does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('ghost-id', { caption: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repo.update).not.toHaveBeenCalled();
    });

    it('edge: changing URL to a duplicate throws ConflictException (P2002)', async () => {
      repo.findById.mockResolvedValue(MEDIA_STUB);
      repo.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(
        service.update('media-1', { url: 'https://other.com/dup.jpg' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('error: unrelated DB error on update propagates as-is', async () => {
      const boom = new Error('timeout');
      repo.findById.mockResolvedValue(MEDIA_STUB);
      repo.update.mockRejectedValue(boom);

      await expect(service.update('media-1', {})).rejects.toBe(boom);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // remove
  // ═══════════════════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('happy: deletes the media item and returns void', async () => {
      repo.findById.mockResolvedValue(MEDIA_STUB);
      repo.delete.mockResolvedValue(undefined);

      await expect(service.remove('media-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('media-1');
    });

    it('error: throws NotFoundException when media does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove('ghost-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // attach
  // ═══════════════════════════════════════════════════════════════════════════
  describe('attach', () => {
    const battleStub = { id: 'battle-1' };

    beforeEach(() => {
      repo.findById.mockResolvedValue(MEDIA_STUB);
    });

    it('happy: attaches media to a battle with default options', async () => {
      repo.findEntityById.mockResolvedValue(battleStub);
      repo.attach.mockResolvedValue(undefined);

      await expect(
        service.attach('media-1', 'battle', 'battle-1'),
      ).resolves.toBeUndefined();

      expect(repo.attach).toHaveBeenCalledWith('battle', 'media-1', 'battle-1', false, 0);
    });

    it('happy: attaches media to a war', async () => {
      repo.findEntityById.mockResolvedValue({ id: 'war-1' });
      repo.attach.mockResolvedValue(undefined);

      await service.attach('media-1', 'war', 'war-1');

      expect(repo.attach).toHaveBeenCalledWith('war', 'media-1', 'war-1', false, 0);
    });

    it('happy: attaches media to a commander', async () => {
      repo.findEntityById.mockResolvedValue({ id: 'cmd-1' });
      repo.attach.mockResolvedValue(undefined);

      await service.attach('media-1', 'commander', 'cmd-1');

      expect(repo.attach).toHaveBeenCalledWith('commander', 'media-1', 'cmd-1', false, 0);
    });

    it('happy: isPrimary=true is forwarded to repository', async () => {
      repo.findEntityById.mockResolvedValue(battleStub);
      repo.attach.mockResolvedValue(undefined);

      await service.attach('media-1', 'battle', 'battle-1', { isPrimary: true });

      expect(repo.attach).toHaveBeenCalledWith('battle', 'media-1', 'battle-1', true, 0);
    });

    it('happy: attach respects custom order value', async () => {
      repo.findEntityById.mockResolvedValue(battleStub);
      repo.attach.mockResolvedValue(undefined);

      await service.attach('media-1', 'battle', 'battle-1', { order: 5 });

      expect(repo.attach).toHaveBeenCalledWith('battle', 'media-1', 'battle-1', false, 5);
    });

    it('error: mediaId not found throws NotFoundException', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.attach('ghost', 'battle', 'battle-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: entityId not found throws NotFoundException', async () => {
      repo.findEntityById.mockResolvedValue(null);

      await expect(
        service.attach('media-1', 'battle', 'ghost-battle'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('edge: already attached throws ConflictException (P2002)', async () => {
      repo.findEntityById.mockResolvedValue(battleStub);
      repo.attach.mockRejectedValue(makePrismaError('P2002'));

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
      repo.detach.mockResolvedValue(1);

      await expect(
        service.detach('media-1', 'battle', 'battle-1'),
      ).resolves.toBeUndefined();

      expect(repo.detach).toHaveBeenCalledWith('battle', 'media-1', 'battle-1');
    });

    it('happy: detaches media from a war', async () => {
      repo.detach.mockResolvedValue(1);

      await service.detach('media-1', 'war', 'war-1');

      expect(repo.detach).toHaveBeenCalledWith('war', 'media-1', 'war-1');
    });

    it('happy: detaches media from a commander', async () => {
      repo.detach.mockResolvedValue(1);

      await service.detach('media-1', 'commander', 'cmd-1');

      expect(repo.detach).toHaveBeenCalledWith('commander', 'media-1', 'cmd-1');
    });

    it('error: not attached throws NotFoundException', async () => {
      repo.detach.mockResolvedValue(0);

      await expect(
        service.detach('media-1', 'battle', 'battle-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('error: unrelated DB error on detach propagates as-is', async () => {
      const boom = new Error('disk full');
      repo.detach.mockRejectedValue(boom);

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
      repo.findPrimaryRow.mockResolvedValue({ media: MEDIA_STUB });

      const result = await service.getPrimary('battle', 'battle-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('happy: returns the primary media for a war', async () => {
      repo.findPrimaryRow.mockResolvedValue({ media: MEDIA_STUB });

      const result = await service.getPrimary('war', 'war-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('happy: returns the primary media for a commander', async () => {
      repo.findPrimaryRow.mockResolvedValue({ media: MEDIA_STUB });

      const result = await service.getPrimary('commander', 'cmd-1');

      expect(result).toEqual(MEDIA_STUB);
    });

    it('edge: no primary set returns null', async () => {
      repo.findPrimaryRow.mockResolvedValue(null);

      const result = await service.getPrimary('battle', 'battle-1');

      expect(result).toBeNull();
    });

    it('edge: entity has no media at all returns null', async () => {
      repo.findPrimaryRow.mockResolvedValue(null);

      const result = await service.getPrimary('war', 'war-99');

      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // listForEntity
  // ═══════════════════════════════════════════════════════════════════════════
  describe('listForEntity', () => {
    it('happy: returns media ordered for a battle', async () => {
      const mediaList = [
        { ...MEDIA_STUB, id: 'media-1' },
        { ...MEDIA_STUB, id: 'media-2' },
      ];
      repo.findAllForEntity.mockResolvedValue(mediaList);

      const result = await service.listForEntity('battle', 'battle-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('media-1');
      expect(result[1].id).toBe('media-2');
      expect(repo.findAllForEntity).toHaveBeenCalledWith('battle', 'battle-1');
    });

    it('happy: returns media for a war', async () => {
      repo.findAllForEntity.mockResolvedValue([MEDIA_STUB]);

      const result = await service.listForEntity('war', 'war-1');

      expect(result).toHaveLength(1);
    });

    it('happy: returns media for a commander', async () => {
      repo.findAllForEntity.mockResolvedValue([MEDIA_STUB]);

      const result = await service.listForEntity('commander', 'cmd-1');

      expect(result).toHaveLength(1);
    });

    it('edge: entity has no media returns empty array', async () => {
      repo.findAllForEntity.mockResolvedValue([]);

      const result = await service.listForEntity('battle', 'battle-empty');

      expect(result).toEqual([]);
    });
  });
});
