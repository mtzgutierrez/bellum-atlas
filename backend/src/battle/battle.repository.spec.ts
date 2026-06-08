import { BattleRepository } from './battle.repository';
import { PrismaService } from '../prisma/prisma.service';

// Verificamos el `where`/`orderBy` que el repositorio construye y pasa a Prisma,
// con un PrismaService mockeado (sin BD). Así ejercitamos buildWhere/orderByFor
// a través de la API pública.
describe('BattleRepository (construcción de queries)', () => {
  let repo: BattleRepository;
  let findMany: jest.Mock;
  let count: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    count = jest.fn().mockResolvedValue(0);
    const prisma = { battle: { findMany, count } } as unknown as PrismaService;
    repo = new BattleRepository(prisma);
  });

  const lastWhere = () => findMany.mock.calls[0][0].where;
  const lastArgs = () => findMany.mock.calls[0][0];

  it('sin filtros → where vacío', async () => {
    await repo.findPaginated({}, 0, 10);
    expect(lastWhere()).toEqual({});
  });

  it('rango de años usa solapamiento (year OR start/end)', async () => {
    await repo.findPaginated({ yearMin: 1900, yearMax: 1950 }, 0, 10);
    const and = lastWhere().AND;
    expect(and[0].OR).toEqual([
      { year: { gte: 1900, lte: 1950 } },
      { AND: [{ startYear: { lte: 1950 } }, { endYear: { gte: 1900 } }] },
    ]);
  });

  it('search aplica contains insensitive y trim', async () => {
    await repo.findPaginated({ search: '  Waterloo  ' }, 0, 10);
    expect(lastWhere().AND).toContainEqual({
      name: { contains: 'Waterloo', mode: 'insensitive' },
    });
  });

  it('search en blanco no añade condición', async () => {
    await repo.findPaginated({ search: '   ' }, 0, 10);
    expect(lastWhere()).toEqual({});
  });

  it('minImportance y type se traducen a condiciones', async () => {
    await repo.findPaginated({ minImportance: 50, type: 'SIEGE' }, 0, 10);
    const and = lastWhere().AND;
    expect(and).toContainEqual({ importanceScore: { gte: 50 } });
    expect(and).toContainEqual({ type: 'SIEGE' });
  });

  it('findPoints exige coordenadas no nulas cuando no hay bbox', async () => {
    await repo.findPoints({});
    expect(lastWhere().AND).toContainEqual({
      latitude: { not: null },
      longitude: { not: null },
    });
  });

  it('bbox acota lat/lng y desactiva el requireCoords', async () => {
    await repo.findPoints({
      bbox: { north: 40, south: 30, east: 5, west: -5 },
    });
    const and = lastWhere().AND;
    expect(and).toContainEqual({
      latitude: { gte: 30, lte: 40 },
      longitude: { gte: -5, lte: 5 },
    });
  });

  it('orderBy por defecto = importancia desc, año asc', async () => {
    await repo.findPaginated({}, 0, 10);
    expect(lastArgs().orderBy).toEqual([
      { importanceScore: 'desc' },
      { year: 'asc' },
    ]);
  });

  it('orderBy year = sortYear asc + importancia', async () => {
    await repo.findPaginated({ sort: 'year' }, 0, 10);
    expect(lastArgs().orderBy).toEqual([
      { sortYear: 'asc' },
      { importanceScore: 'desc' },
    ]);
  });

  it('orderBy name = name asc', async () => {
    await repo.findPaginated({ sort: 'name' }, 0, 10);
    expect(lastArgs().orderBy).toEqual([{ name: 'asc' }]);
  });

  it('findByIdOrSlug añade rama por id solo si es UUID', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    (repo as unknown as { prisma: { battle: { findFirst: jest.Mock } } }).prisma =
      { battle: { findFirst } } as never;

    await repo.findByIdOrSlug('not-a-uuid');
    expect(findFirst.mock.calls[0][0].where.OR).toEqual([{ slug: 'not-a-uuid' }]);

    await repo.findByIdOrSlug('123e4567-e89b-12d3-a456-426614174000');
    expect(findFirst.mock.calls[1][0].where.OR).toEqual([
      { slug: '123e4567-e89b-12d3-a456-426614174000' },
      { id: '123e4567-e89b-12d3-a456-426614174000' },
    ]);
  });
});
