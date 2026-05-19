import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommanderController } from './commander.controller';
import { CommanderService } from './commander.service';

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(), Prisma: {} }));

const PAGINATED_STUB = {
  data: [{ id: 'cmd-1', name: 'Arthur Wellesley' }],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};
const DETAIL_STUB = {
  id: 'cmd-1',
  name: 'Arthur Wellesley',
  battles: [],
  stats: { total: 0, victories: 0, winRate: 0 },
};

const mockCommanderService = { findAll: jest.fn(), findOne: jest.fn() };

describe('CommanderController', () => {
  let controller: CommanderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommanderController],
      providers: [{ provide: CommanderService, useValue: mockCommanderService }],
    }).compile();
    controller = module.get<CommanderController>(CommanderController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('happy: delegates with parsed params', async () => {
      mockCommanderService.findAll.mockResolvedValue(PAGINATED_STUB);

      const result = await controller.findAll('Wellington', '1', '10');

      expect(mockCommanderService.findAll).toHaveBeenCalledWith({ q: 'Wellington', page: 1, limit: 10 });
      expect(result).toEqual(PAGINATED_STUB);
    });

    it('edge: no params → all undefined', async () => {
      mockCommanderService.findAll.mockResolvedValue(PAGINATED_STUB);

      await controller.findAll();

      expect(mockCommanderService.findAll).toHaveBeenCalledWith({ q: undefined, page: undefined, limit: undefined });
    });

    it('error: propagates errors', async () => {
      mockCommanderService.findAll.mockRejectedValue(new Error('db'));

      await expect(controller.findAll()).rejects.toThrow('db');
    });
  });

  describe('findOne', () => {
    it('happy: returns commander detail', async () => {
      mockCommanderService.findOne.mockResolvedValue(DETAIL_STUB);

      const result = await controller.findOne('cmd-1');

      expect(mockCommanderService.findOne).toHaveBeenCalledWith('cmd-1');
      expect(result).toEqual(DETAIL_STUB);
    });

    it('error: propagates NotFoundException', async () => {
      mockCommanderService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
