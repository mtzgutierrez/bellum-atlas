import { Queue } from 'bullmq';
import { AiQueueService } from './ai-queue.service';
import type { GenerateAIJobData } from './ai.types';

describe('AiQueueService', () => {
  let queue: {
    remove: jest.Mock;
    add: jest.Mock;
    getJob: jest.Mock;
    getWaitingCount: jest.Mock;
  };
  let service: AiQueueService;

  const data: GenerateAIJobData = { battleId: 'b1', reason: 'auto-ingest' };

  beforeEach(() => {
    queue = {
      remove: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
      getJob: jest.fn(),
      getWaitingCount: jest.fn(),
    };
    service = new AiQueueService(queue as unknown as Queue<GenerateAIJobData>);
  });

  it('elimina el job previo y añade con jobId estable y reintentos', async () => {
    await service.enqueue(data);

    expect(queue.remove).toHaveBeenCalledWith('b1');
    expect(queue.add).toHaveBeenCalledWith(
      'generate',
      data,
      expect.objectContaining({
        jobId: 'b1',
        attempts: 3,
        removeOnComplete: true,
      }),
    );
    // remove se invoca antes que add.
    expect(queue.remove.mock.invocationCallOrder[0]).toBeLessThan(
      queue.add.mock.invocationCallOrder[0],
    );
  });

  it('si remove falla (job activo) sigue encolando', async () => {
    queue.remove.mockRejectedValue(new Error('job activo'));
    await expect(service.enqueue(data)).resolves.toBeUndefined();
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it('queuePosition devuelve undefined si el job no existe', async () => {
    queue.getJob.mockResolvedValue(undefined);
    expect(await service.queuePosition('b1')).toBeUndefined();
  });

  it('queuePosition devuelve undefined para jobs completados', async () => {
    queue.getJob.mockResolvedValue({ getState: async () => 'completed' });
    expect(await service.queuePosition('b1')).toBeUndefined();
  });

  it('queuePosition devuelve el nº en espera para jobs pendientes', async () => {
    queue.getJob.mockResolvedValue({ getState: async () => 'waiting' });
    queue.getWaitingCount.mockResolvedValue(7);
    expect(await service.queuePosition('b1')).toBe(7);
  });
});
