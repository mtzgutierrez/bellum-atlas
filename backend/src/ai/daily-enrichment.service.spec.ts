import { DailyEnrichmentService } from './daily-enrichment.service';
import { AiQueueService } from './ai-queue.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DailyEnrichmentService', () => {
  let findFirst: jest.Mock;
  let enqueue: jest.Mock;
  let service: DailyEnrichmentService;

  beforeEach(() => {
    findFirst = jest.fn();
    enqueue = jest.fn().mockResolvedValue(undefined);
    const prisma = { battle: { findFirst } } as unknown as PrismaService;
    const queue = { enqueue } as unknown as AiQueueService;
    service = new DailyEnrichmentService(prisma, queue);
  });

  describe('pickTarget', () => {
    it('prioriza la efeméride de hoy sin narrativa', async () => {
      findFirst.mockResolvedValueOnce({
        id: 'e1',
        name: 'Efeméride',
        importanceScore: 90,
      });
      const t = await service.pickTarget();
      expect(t).toMatchObject({ id: 'e1', source: 'efeméride de hoy' });
      expect(findFirst).toHaveBeenCalledTimes(1); // no consulta el global
    });

    it('cae al top global si no hay efeméride pendiente', async () => {
      findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'g1', name: 'Global', importanceScore: 99 });
      const t = await service.pickTarget();
      expect(t).toMatchObject({ id: 'g1', source: 'top global' });
      expect(findFirst).toHaveBeenCalledTimes(2);
    });

    it('devuelve null si todo tiene narrativa', async () => {
      findFirst.mockResolvedValue(null);
      expect(await service.pickTarget()).toBeNull();
    });
  });

  describe('run', () => {
    it('encola con webSearch:true y reason daily-enrichment', async () => {
      findFirst.mockResolvedValueOnce({
        id: 'e1',
        name: 'Efeméride',
        importanceScore: 90,
      });
      await service.run();
      expect(enqueue).toHaveBeenCalledWith({
        battleId: 'e1',
        reason: 'daily-enrichment',
        webSearch: true,
      });
    });

    it('no encola nada si no hay objetivo', async () => {
      findFirst.mockResolvedValue(null);
      await service.run();
      expect(enqueue).not.toHaveBeenCalled();
    });
  });
});
