import { IngestionService } from './ingestion.service';
import { WikidataClient, RawBattle } from './wikidata.client';
import { PrismaService } from '../prisma/prisma.service';

const rawBattle = (over: Partial<RawBattle> = {}): RawBattle => ({
  qid: 'Q100',
  name: 'Batalla X',
  year: 1500,
  startYear: null,
  endYear: null,
  date: null,
  startDate: null,
  endDate: null,
  latitude: 10,
  longitude: 20,
  imageUrl: null,
  wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_X',
  wikipediaUrlEn: null,
  sitelinkCount: 90,
  type: 'BATTLE',
  ...over,
});

describe('IngestionService', () => {
  let service: IngestionService;
  let client: { fetchBattle: jest.Mock; fetchWikipediaContent: jest.Mock };
  let findUnique: jest.Mock;
  let update: jest.Mock;
  let create: jest.Mock;

  beforeEach(() => {
    client = {
      fetchBattle: jest.fn(),
      fetchWikipediaContent: jest
        .fn()
        .mockResolvedValue({ extract: 'resumen', imageUrl: null }),
    };
    findUnique = jest.fn();
    update = jest.fn().mockResolvedValue({ id: 'updated' });
    create = jest.fn().mockResolvedValue({ id: 'created' });

    const prisma = { battle: { findUnique, update, create } } as unknown as PrismaService;
    service = new IngestionService(client as unknown as WikidataClient, prisma);
  });

  // findUnique responde según se busque por wikidataId o por slug.
  const placement = (opts: {
    byQid?: { id: string } | null;
    bySlug?: { id: string; wikidataId: string | null } | null;
  }) => {
    findUnique.mockImplementation(({ where }: { where: Record<string, unknown> }) => {
      if ('wikidataId' in where) return Promise.resolve(opts.byQid ?? null);
      if ('slug' in where) return Promise.resolve(opts.bySlug ?? null);
      return Promise.resolve(null);
    });
  };

  it('rama 1: existe wikidataId → update idempotente', async () => {
    client.fetchBattle.mockResolvedValue(rawBattle());
    placement({ byQid: { id: 'q-existing' } });

    await service.ingestBattle('Q100');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'q-existing' } }),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('rama 2: slug sin wikidataId → adopta la fila del seed (update)', async () => {
    client.fetchBattle.mockResolvedValue(rawBattle());
    placement({ byQid: null, bySlug: { id: 'seed-row', wikidataId: null } });

    await service.ingestBattle('Q100');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'seed-row' } }),
    );
  });

  it('rama 3: slug con otro wikidataId → create con slug sufijado', async () => {
    client.fetchBattle.mockResolvedValue(rawBattle());
    placement({ byQid: null, bySlug: { id: 'otro', wikidataId: 'Q999' } });

    await service.ingestBattle('Q100');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'batalla-x-q100' }),
      }),
    );
  });

  it('rama 4: nada existe → create con slug limpio', async () => {
    client.fetchBattle.mockResolvedValue(rawBattle());
    placement({ byQid: null, bySlug: null });

    await service.ingestBattle('Q100');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'batalla-x', wikidataId: 'Q100' }),
      }),
    );
  });

  it('clampScore capa a 100 y descarta coords fuera de rango', async () => {
    client.fetchBattle.mockResolvedValue(
      rawBattle({ sitelinkCount: 150, latitude: 200, longitude: -999 }),
    );
    placement({ byQid: null, bySlug: null });

    await service.ingestBattle('Q100');

    const data = create.mock.calls[0][0].data;
    expect(data.importanceScore).toBe(100);
    expect(data.latitude).toBeNull();
    expect(data.longitude).toBeNull();
  });

  it('la ingesta NO genera narrativa por IA (eso es del enriquecimiento diario)', async () => {
    // Aunque el score sea muy alto, ingerir una batalla no debe disparar la IA:
    // la única vía que consume la API es DailyEnrichmentService.
    client.fetchBattle.mockResolvedValue(rawBattle({ sitelinkCount: 100 }));
    placement({ byQid: null, bySlug: null });

    await expect(service.ingestBattle('Q100')).resolves.toBe('created');
  });

  it('devuelve null si Wikidata no encuentra la batalla', async () => {
    client.fetchBattle.mockResolvedValue(null);
    expect(await service.ingestBattle('Q404')).toBeNull();
  });
});
