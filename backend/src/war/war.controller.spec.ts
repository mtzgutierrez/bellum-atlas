import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WarController } from './war.controller';
import { WarService } from './war.service';

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(), Prisma: {} }));

const PAGINATED_STUB = {
  data: [{ id: 'war-1', name: 'Guerras Napoleónicas' }],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};
const DETAIL_STUB = { id: 'war-1', name: 'Guerras Napoleónicas', stats: { totalBattles: 5, durationDays: 4568 } };

const mockWarService = { findAll: jest.fn(), findOne: jest.fn() };

describe('WarController', () => {
  let controller: WarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarController],
      providers: [{ provide: WarService, useValue: mockWarService }],
    }).compile();
    controller = module.get<WarController>(WarController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('happy: delegates with parsed pagination', async () => {
      mockWarService.findAll.mockResolvedValue(PAGINATED_STUB);

      const result = await controller.findAll('Napoleon', '2', '10');

      expect(mockWarService.findAll).toHaveBeenCalledWith({ q: 'Napoleon', page: 2, limit: 10 });
      expect(result).toEqual(PAGINATED_STUB);
    });

    it('edge: no params → all undefined', async () => {
      mockWarService.findAll.mockResolvedValue(PAGINATED_STUB);

      await controller.findAll();

      expect(mockWarService.findAll).toHaveBeenCalledWith({ q: undefined, page: undefined, limit: undefined });
    });

    it('error: propagates service errors', async () => {
      mockWarService.findAll.mockRejectedValue(new Error('db'));

      await expect(controller.findAll()).rejects.toThrow('db');
    });
  });

  describe('findOne', () => {
    it('happy: returns war detail', async () => {
      mockWarService.findOne.mockResolvedValue(DETAIL_STUB);

      const result = await controller.findOne('war-1');

      expect(mockWarService.findOne).toHaveBeenCalledWith('war-1');
      expect(result).toEqual(DETAIL_STUB);
    });

    it('error: propagates NotFoundException', async () => {
      mockWarService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
