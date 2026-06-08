import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import type { BattlesQueryDto } from './dto/battle.dto';

// Probamos parseFilters/timeline a través del controller con el servicio
// mockeado: capturamos los filtros que recibe el servicio.
describe('BattleController', () => {
  let controller: BattleController;
  let service: jest.Mocked<Pick<BattleService, 'points' | 'list' | 'timeline'>>;

  beforeEach(async () => {
    service = {
      points: jest.fn().mockResolvedValue([]),
      list: jest.fn().mockResolvedValue({ data: [], meta: {} }),
      timeline: jest.fn().mockResolvedValue([]),
    } as never;

    const moduleRef = await Test.createTestingModule({
      controllers: [BattleController],
      providers: [{ provide: BattleService, useValue: service }],
    }).compile();

    controller = moduleRef.get(BattleController);
  });

  describe('parseFilters (vía points/list)', () => {
    it('rechaza rango de años > 150 sin bbox', async () => {
      const q = { yearMin: '1000', yearMax: '1200' } as BattlesQueryDto;
      await expect(controller.list(q)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite rango > 150 si hay bbox completo', async () => {
      const q = {
        yearMin: '1000',
        yearMax: '1200',
        bboxN: '40',
        bboxS: '30',
        bboxE: '5',
        bboxW: '-5',
      } as BattlesQueryDto;
      await controller.points(q);
      expect(service.points).toHaveBeenCalledTimes(1);
      const filters = service.points.mock.calls[0][0];
      expect(filters.bbox).toEqual({ north: 40, south: 30, east: 5, west: -5 });
    });

    it('ignora bbox parcial (falta un borde)', async () => {
      const q = { bboxN: '40', bboxS: '30', bboxE: '5' } as BattlesQueryDto;
      await controller.points(q);
      expect(service.points.mock.calls[0][0].bbox).toBeUndefined();
    });

    it('descarta type/sort inválidos y conserva los válidos', async () => {
      await controller.points({ type: 'NOPE', sort: 'year' } as never);
      const f = service.points.mock.calls[0][0];
      expect(f.type).toBeUndefined();
      expect(f.sort).toBe('year');
    });

    it('convierte yearMin/minImportance no numéricos en undefined', async () => {
      await controller.points({ yearMin: 'x', minImportance: 'abc' } as never);
      const f = service.points.mock.calls[0][0];
      expect(f.yearMin).toBeUndefined();
      expect(f.minImportance).toBeUndefined();
    });
  });

  describe('timeline', () => {
    it('capa el límite a 300', async () => {
      await controller.timeline('5000');
      expect(service.timeline).toHaveBeenCalledWith(300);
    });

    it('usa 150 por defecto si el límite no es válido', async () => {
      await controller.timeline('abc');
      expect(service.timeline).toHaveBeenCalledWith(150);
      await controller.timeline(undefined);
      expect(service.timeline).toHaveBeenLastCalledWith(150);
    });
  });
});
