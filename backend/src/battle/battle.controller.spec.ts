import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BattleType } from '@prisma/client';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';

// @prisma/client is only available after `prisma generate`.
jest.mock('@prisma/client', () => ({
  BattleType: { LAND: 'LAND', NAVAL: 'NAVAL', AIR: 'AIR', SIEGE: 'SIEGE', MIXED: 'MIXED' },
  PrismaClient: jest.fn(),
}));

const PAGINATED_STUB = {
  data: [{ id: 'battle-1', name: 'Batalla de Waterloo' }],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

const DETAIL_STUB = {
  id: 'battle-1',
  name: 'Batalla de Waterloo',
  factions: [],
  relatedBattles: [],
};

const mockBattleService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('BattleController', () => {
  let controller: BattleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BattleController],
      providers: [{ provide: BattleService, useValue: mockBattleService }],
    }).compile();
    controller = module.get<BattleController>(BattleController);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('happy: delegates to service with parsed params', async () => {
      mockBattleService.findAll.mockResolvedValue(PAGINATED_STUB);

      const result = await controller.findAll(
        'Waterloo', 'contemporary', 'victory', BattleType.LAND, 'Belgium', '2', '10', 'name',
      );

      expect(mockBattleService.findAll).toHaveBeenCalledWith({
        q: 'Waterloo',
        era: 'contemporary',
        result: 'victory',
        type: BattleType.LAND,
        country: 'Belgium',
        page: 2,
        limit: 10,
        sortBy: 'name',
      });
      expect(result).toEqual(PAGINATED_STUB);
    });

    it('edge: undefined page and limit are passed as undefined (not NaN)', async () => {
      mockBattleService.findAll.mockResolvedValue(PAGINATED_STUB);

      await controller.findAll();

      expect(mockBattleService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: undefined, limit: undefined }),
      );
    });

    it('error: propagates errors from service', async () => {
      mockBattleService.findAll.mockRejectedValue(new Error('db error'));

      await expect(controller.findAll()).rejects.toThrow('db error');
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('happy: returns battle detail by id', async () => {
      mockBattleService.findOne.mockResolvedValue(DETAIL_STUB);

      const result = await controller.findOne('battle-1');

      expect(mockBattleService.findOne).toHaveBeenCalledWith('battle-1');
      expect(result).toEqual(DETAIL_STUB);
    });

    it('happy: forwards slug to service', async () => {
      mockBattleService.findOne.mockResolvedValue(DETAIL_STUB);

      await controller.findOne('batalla-de-waterloo');

      expect(mockBattleService.findOne).toHaveBeenCalledWith('batalla-de-waterloo');
    });

    it('error: propagates NotFoundException from service', async () => {
      mockBattleService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
