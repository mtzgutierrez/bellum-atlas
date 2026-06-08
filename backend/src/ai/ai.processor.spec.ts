import type { Job } from 'bullmq';
import { AiProcessor } from './ai.processor';
import { LlmService } from './llm.service';
import { PrismaService } from '../prisma/prisma.service';
import * as wikipediaSource from './wikipedia-source';
import type { GenerateAIJobData } from './ai.types';

jest.mock('./wikipedia-source');

describe('AiProcessor', () => {
  let summaryFindUnique: jest.Mock;
  let battleFindUnique: jest.Mock;
  let summaryCreate: jest.Mock;
  let llm: { generate: jest.Mock; modelId: jest.Mock; isReal: jest.Mock };
  let processor: AiProcessor;
  const fetchArticleText = wikipediaSource.fetchArticleText as jest.Mock;

  const job = (data: GenerateAIJobData) => ({ data }) as Job<GenerateAIJobData>;

  const battleRow = {
    id: 'b1',
    name: 'Batalla Z',
    year: 1500,
    startYear: null,
    endYear: null,
    date: null,
    startDate: null,
    endDate: null,
    type: 'BATTLE',
    latitude: null,
    longitude: null,
    summary: 'extract corto',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Z',
  };

  beforeEach(() => {
    summaryFindUnique = jest.fn();
    battleFindUnique = jest.fn();
    summaryCreate = jest.fn().mockResolvedValue({ id: 's1' });
    llm = {
      generate: jest.fn().mockResolvedValue({
        summary: 's',
        context: 'c',
        outcome: 'o',
        curiosities: 'cur',
      }),
      modelId: jest.fn().mockReturnValue('claude-sonnet-4-6'),
      isReal: jest.fn().mockReturnValue(true),
    };
    const prisma = {
      battleAISummary: { findUnique: summaryFindUnique, create: summaryCreate },
      battle: { findUnique: battleFindUnique },
    } as unknown as PrismaService;
    processor = new AiProcessor(prisma, llm as unknown as LlmService);
    fetchArticleText.mockReset();
  });

  it('idempotente: si ya existe summary no genera ni crea', async () => {
    summaryFindUnique.mockResolvedValue({ id: 'existing' });
    await processor.process(job({ battleId: 'b1', reason: 'auto-ingest' }));
    expect(llm.generate).not.toHaveBeenCalled();
    expect(summaryCreate).not.toHaveBeenCalled();
  });

  it('descarta si la batalla no existe', async () => {
    summaryFindUnique.mockResolvedValue(null);
    battleFindUnique.mockResolvedValue(null);
    await processor.process(job({ battleId: 'x', reason: 'auto-ingest' }));
    expect(summaryCreate).not.toHaveBeenCalled();
  });

  it('genera, calcula promptHash y persiste con usedWebSearch', async () => {
    summaryFindUnique.mockResolvedValue(null);
    battleFindUnique.mockResolvedValue(battleRow);
    fetchArticleText.mockResolvedValue('artículo completo');

    await processor.process(
      job({ battleId: 'b1', reason: 'daily-enrichment', webSearch: true }),
    );

    expect(llm.generate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Batalla Z', sourceText: 'artículo completo' }),
      { webSearch: true },
    );
    const created = summaryCreate.mock.calls[0][0].data;
    expect(created).toMatchObject({
      battleId: 'b1',
      modelUsed: 'claude-sonnet-4-6',
      usedWebSearch: true,
    });
    expect(created.promptHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('usedWebSearch=false si el provider no es real', async () => {
    summaryFindUnique.mockResolvedValue(null);
    battleFindUnique.mockResolvedValue(battleRow);
    fetchArticleText.mockResolvedValue(null); // cae al summary corto
    llm.isReal.mockReturnValue(false);

    await processor.process(
      job({ battleId: 'b1', reason: 'daily-enrichment', webSearch: true }),
    );

    expect(llm.generate).toHaveBeenCalledWith(
      expect.objectContaining({ sourceText: 'extract corto' }),
      { webSearch: true },
    );
    expect(summaryCreate.mock.calls[0][0].data.usedWebSearch).toBe(false);
  });
});
