import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MediaSource } from '@prisma/client';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

// ─── Stub data ────────────────────────────────────────────────────────────────

const MEDIA_STUB = {
  id: 'media-1',
  url: 'https://upload.wikimedia.org/img.jpg',
  source: MediaSource.WIKIMEDIA,
  license: 'CC-BY-SA-4.0',
  caption: null,
  altText: null,
  width: 1200,
  height: 800,
  mimeType: 'image/jpeg',
  wikiTitle: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

// ─── Mock service ─────────────────────────────────────────────────────────────

const mockMediaService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  attach: jest.fn(),
  detach: jest.fn(),
  getPrimary: jest.fn(),
  listForEntity: jest.fn(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mockMediaService }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('happy: delegates to service and returns created media', async () => {
      mockMediaService.create.mockResolvedValue(MEDIA_STUB);

      const result = await controller.create({ url: MEDIA_STUB.url });

      expect(mockMediaService.create).toHaveBeenCalledWith({ url: MEDIA_STUB.url });
      expect(result).toEqual(MEDIA_STUB);
    });

    it('error: propagates ConflictException from service', async () => {
      mockMediaService.create.mockRejectedValue(new ConflictException('dup'));

      await expect(controller.create({ url: 'dup.jpg' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('happy: returns paginated result', async () => {
      const expected = { data: [MEDIA_STUB], total: 1 };
      mockMediaService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(undefined, '0', '10');

      expect(mockMediaService.findAll).toHaveBeenCalledWith({
        source: undefined,
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(expected);
    });

    it('edge: skip and take are undefined when not provided', async () => {
      mockMediaService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll(undefined, undefined, undefined);

      expect(mockMediaService.findAll).toHaveBeenCalledWith({
        source: undefined,
        skip: undefined,
        take: undefined,
      });
    });

    it('edge: source filter is forwarded to service', async () => {
      mockMediaService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll(MediaSource.CUSTOM, undefined, undefined);

      expect(mockMediaService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ source: MediaSource.CUSTOM }),
      );
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('happy: returns media item by id', async () => {
      mockMediaService.findOne.mockResolvedValue(MEDIA_STUB);

      const result = await controller.findOne('media-1');

      expect(mockMediaService.findOne).toHaveBeenCalledWith('media-1');
      expect(result).toEqual(MEDIA_STUB);
    });

    it('error: propagates NotFoundException from service', async () => {
      mockMediaService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('happy: updates and returns the updated item', async () => {
      const updated = { ...MEDIA_STUB, caption: 'New caption' };
      mockMediaService.update.mockResolvedValue(updated);

      const result = await controller.update('media-1', { caption: 'New caption' });

      expect(mockMediaService.update).toHaveBeenCalledWith('media-1', {
        caption: 'New caption',
      });
      expect(result.caption).toBe('New caption');
    });

    it('error: propagates NotFoundException from service', async () => {
      mockMediaService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update('ghost', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('edge: propagates ConflictException on duplicate URL', async () => {
      mockMediaService.update.mockRejectedValue(new ConflictException('dup'));

      await expect(
        controller.update('media-1', { url: 'dup.jpg' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('happy: removes media item (no return value)', async () => {
      mockMediaService.remove.mockResolvedValue(undefined);

      await expect(controller.remove('media-1')).resolves.toBeUndefined();
      expect(mockMediaService.remove).toHaveBeenCalledWith('media-1');
    });

    it('error: propagates NotFoundException from service', async () => {
      mockMediaService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ─── attach ──────────────────────────────────────────────────────────────

  describe('attach', () => {
    it('happy: attaches media to a battle', async () => {
      mockMediaService.attach.mockResolvedValue(undefined);

      await expect(
        controller.attach('media-1', 'battle', 'battle-1', {}),
      ).resolves.toBeUndefined();

      expect(mockMediaService.attach).toHaveBeenCalledWith(
        'media-1',
        'battle',
        'battle-1',
        {},
      );
    });

    it('happy: forwards isPrimary and order to service', async () => {
      mockMediaService.attach.mockResolvedValue(undefined);

      await controller.attach('media-1', 'war', 'war-1', {
        isPrimary: true,
        order: 2,
      });

      expect(mockMediaService.attach).toHaveBeenCalledWith(
        'media-1',
        'war',
        'war-1',
        { isPrimary: true, order: 2 },
      );
    });

    it('error: propagates ConflictException when already attached', async () => {
      mockMediaService.attach.mockRejectedValue(new ConflictException('dup'));

      await expect(
        controller.attach('media-1', 'battle', 'battle-1', {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('error: propagates NotFoundException when entity not found', async () => {
      mockMediaService.attach.mockRejectedValue(new NotFoundException());

      await expect(
        controller.attach('media-1', 'commander', 'ghost', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── detach ──────────────────────────────────────────────────────────────

  describe('detach', () => {
    it('happy: detaches media from a war', async () => {
      mockMediaService.detach.mockResolvedValue(undefined);

      await expect(
        controller.detach('media-1', 'war', 'war-1'),
      ).resolves.toBeUndefined();

      expect(mockMediaService.detach).toHaveBeenCalledWith(
        'media-1',
        'war',
        'war-1',
      );
    });

    it('error: propagates NotFoundException when not attached', async () => {
      mockMediaService.detach.mockRejectedValue(new NotFoundException());

      await expect(
        controller.detach('media-1', 'war', 'war-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── listForEntity ───────────────────────────────────────────────────────

  describe('listForEntity', () => {
    it('happy: returns list of media for a battle', async () => {
      mockMediaService.listForEntity.mockResolvedValue([MEDIA_STUB]);

      const result = await controller.listForEntity('battle', 'battle-1');

      expect(mockMediaService.listForEntity).toHaveBeenCalledWith(
        'battle',
        'battle-1',
      );
      expect(result).toHaveLength(1);
    });

    it('edge: returns empty array when no media', async () => {
      mockMediaService.listForEntity.mockResolvedValue([]);

      const result = await controller.listForEntity('battle', 'empty');

      expect(result).toEqual([]);
    });
  });

  // ─── getPrimary ──────────────────────────────────────────────────────────

  describe('getPrimary', () => {
    it('happy: returns the primary media', async () => {
      mockMediaService.getPrimary.mockResolvedValue(MEDIA_STUB);

      const result = await controller.getPrimary('commander', 'cmd-1');

      expect(mockMediaService.getPrimary).toHaveBeenCalledWith('commander', 'cmd-1');
      expect(result).toEqual(MEDIA_STUB);
    });

    it('edge: returns null when no primary is set', async () => {
      mockMediaService.getPrimary.mockResolvedValue(null);

      const result = await controller.getPrimary('battle', 'battle-no-img');

      expect(result).toBeNull();
    });
  });
});
