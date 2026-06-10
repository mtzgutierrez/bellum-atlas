import { buildMeta, normalizePagination } from './pagination.dto';

describe('normalizePagination', () => {
  it('aplica defaults cuando no hay query', () => {
    expect(normalizePagination({})).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
      take: 20,
    });
  });

  it('capa pageSize al máximo (50)', () => {
    const r = normalizePagination({ pageSize: '999' });
    expect(r.pageSize).toBe(50);
    expect(r.take).toBe(50);
  });

  it('valores no numéricos o <=0 caen a defaults', () => {
    expect(normalizePagination({ page: 'abc', pageSize: '-5' })).toMatchObject({
      page: 1,
      pageSize: 20,
    });
  });

  it('calcula skip a partir de page y pageSize', () => {
    expect(normalizePagination({ page: '3', pageSize: '10' })).toMatchObject({
      page: 3,
      pageSize: 10,
      skip: 20,
      take: 10,
    });
  });

  it('trunca page decimal hacia abajo', () => {
    expect(normalizePagination({ page: '2.9' }).page).toBe(2);
  });
});

describe('buildMeta', () => {
  it('calcula totalPages redondeando hacia arriba', () => {
    expect(buildMeta(45, 1, 20)).toEqual({
      total: 45,
      page: 1,
      pageSize: 20,
      totalPages: 3,
    });
  });

  it('total=0 produce al menos 1 página', () => {
    expect(buildMeta(0, 1, 20).totalPages).toBe(1);
  });
});
