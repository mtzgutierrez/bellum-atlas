import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import type { BattleAIInput } from './ai.types';

const cfg = (map: Record<string, string>): ConfigService =>
  ({ get: (k: string) => map[k] }) as unknown as ConfigService;

const input = (over: Partial<BattleAIInput> = {}): BattleAIInput => ({
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
  sourceText: 'Texto de referencia de la batalla.',
  ...over,
});

describe('LlmService', () => {
  it('por defecto usa el provider mock (sin coste, sin red)', () => {
    const svc = new LlmService(cfg({}));
    svc.onModuleInit();
    expect(svc.isReal()).toBe(false);
    expect(svc.modelId()).toBe('mock');
  });

  it('mock: generate devuelve los 4 campos con nombre y año', async () => {
    const svc = new LlmService(cfg({}));
    svc.onModuleInit();
    const story = await svc.generate(input());
    expect(Object.keys(story).sort()).toEqual([
      'context',
      'curiosities',
      'outcome',
      'summary',
    ]);
    expect(story.summary).toContain('Batalla Z');
    expect(story.summary).toContain('1500');
  });

  it('anthropic sin API key → cae a mock', () => {
    const svc = new LlmService(cfg({ AI_PROVIDER: 'anthropic' }));
    svc.onModuleInit();
    expect(svc.isReal()).toBe(false);
    expect(svc.modelId()).toBe('mock');
  });

  it('anthropic con API key → provider real y modelo configurado', () => {
    const svc = new LlmService(
      cfg({
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        AI_MODEL: 'claude-opus-4-8',
      }),
    );
    svc.onModuleInit();
    expect(svc.isReal()).toBe(true);
    expect(svc.modelId()).toBe('claude-opus-4-8');
  });

  it('en mock, generate ignora la opción webSearch', async () => {
    const svc = new LlmService(cfg({ AI_WEB_SEARCH: 'false' }));
    svc.onModuleInit();
    const story = await svc.generate(input(), { webSearch: true });
    expect(story.summary).toContain('Batalla Z');
  });
});
