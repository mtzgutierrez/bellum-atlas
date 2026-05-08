import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ScraperBattleDto } from './dto/scraper-battle.dto';

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_DTO: ScraperBattleDto = {
  type: 'battle',
  title: 'Battle of Thermopylae',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Battle_of_Thermopylae',
};

function buildMockService(): jest.Mocked<ScraperService> {
  return {
    upsertBattle: jest.fn(),
  } as unknown as jest.Mocked<ScraperService>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ScraperController', () => {
  let controller: ScraperController;
  let service: jest.Mocked<ScraperService>;

  beforeEach(async () => {
    service = buildMockService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScraperController],
      providers: [{ provide: ScraperService, useValue: service }],
    })
      // Override the guard so controller logic can be tested in isolation
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ScraperController>(ScraperController);
  });

  afterEach(() => jest.clearAllMocks());

  // ── upsertBattle ─────────────────────────────────────────────────────────

  describe('upsertBattle', () => {
    it('delegates to ScraperService.upsertBattle and returns the result', async () => {
      const expected = { id: 'uuid-1', slug: 'battle-of-thermopylae', name: 'Battle of Thermopylae' };
      service.upsertBattle.mockResolvedValue(expected);

      const result = await controller.upsertBattle(BASE_DTO);

      expect(service.upsertBattle).toHaveBeenCalledTimes(1);
      expect(service.upsertBattle).toHaveBeenCalledWith(BASE_DTO);
      expect(result).toBe(expected);
    });

    it('passes the full DTO (all optional fields) to the service', async () => {
      const fullDto: ScraperBattleDto = {
        ...BASE_DTO,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thermopylae.jpg',
        dateText: '480 BC',
        date: '-000480-01-01',
        place: 'Thermopylae, Greece',
        coordinates: { lat: 38.8, lon: 22.5 },
        result: 'Persian victory',
        belligerents: { side1: 'Sparta', side2: 'Persia' },
        commanders: { side1: 'Leonidas I', side2: 'Xerxes I' },
        strength: { side1: '7,000', side2: '100,000+' },
        casualties: { side1: '~4,000', side2: '~20,000' },
      };

      service.upsertBattle.mockResolvedValue({
        id: 'uuid-2',
        slug: 'battle-of-thermopylae',
        name: 'Battle of Thermopylae',
      });

      await controller.upsertBattle(fullDto);

      expect(service.upsertBattle).toHaveBeenCalledWith(fullDto);
    });

    it('propagates errors thrown by the service', async () => {
      const boom = new Error('transaction failed');
      service.upsertBattle.mockRejectedValue(boom);

      await expect(controller.upsertBattle(BASE_DTO)).rejects.toBe(boom);
    });

    it('propagates NestJS HTTP exceptions from the service unchanged', async () => {
      service.upsertBattle.mockRejectedValue(new NotFoundException('battle not found'));

      await expect(controller.upsertBattle(BASE_DTO)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

// ── ApiKeyGuard unit tests ────────────────────────────────────────────────────

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  const ORIGINAL_ENV = process.env.SCRAPER_API_KEY;

  beforeEach(() => {
    guard = new ApiKeyGuard();
  });

  afterEach(() => {
    // Restore original env value (or delete if it wasn't set)
    if (ORIGINAL_ENV === undefined) {
      delete process.env.SCRAPER_API_KEY;
    } else {
      process.env.SCRAPER_API_KEY = ORIGINAL_ENV;
    }
  });

  function buildContext(headers: Record<string, string | undefined>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as unknown as ExecutionContext;
  }

  it('returns true when the correct API key is provided', () => {
    process.env.SCRAPER_API_KEY = 'super-secret';
    const ctx = buildContext({ 'x-api-key': 'super-secret' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws UnauthorizedException when SCRAPER_API_KEY is not set (fail-secure)', () => {
    delete process.env.SCRAPER_API_KEY;
    const ctx = buildContext({ 'x-api-key': 'any-key' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the header is absent', () => {
    process.env.SCRAPER_API_KEY = 'super-secret';
    const ctx = buildContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the header value is wrong', () => {
    process.env.SCRAPER_API_KEY = 'super-secret';
    const ctx = buildContext({ 'x-api-key': 'wrong-key' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('is case-sensitive (does not accept different-case keys)', () => {
    process.env.SCRAPER_API_KEY = 'MyKey';
    const ctx = buildContext({ 'x-api-key': 'mykey' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
