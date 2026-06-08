import {
  buildMeta,
  normalisePagination,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from './pagination.util';

describe('normalisePagination', () => {
  it('defaults cuando no se pasan argumentos', () => {
    expect(normalisePagination()).toEqual({
      page: 1,
      limit: DEFAULT_LIMIT,
      skip: 0,
      take: DEFAULT_LIMIT,
    });
  });

  it('fuerza page >= 1', () => {
    expect(normalisePagination(0).page).toBe(1);
    expect(normalisePagination(-3).page).toBe(1);
  });

  it('capa limit a [1, MAX_LIMIT]', () => {
    expect(normalisePagination(1, 10_000).limit).toBe(MAX_LIMIT);
    expect(normalisePagination(1, 0).limit).toBe(1);
  });

  it('calcula skip = (page-1)*limit', () => {
    expect(normalisePagination(4, 25).skip).toBe(75);
  });
});

describe('buildMeta (util)', () => {
  it('totalPages = ceil(total/limit)', () => {
    expect(buildMeta(21, 1, 10)).toEqual({
      total: 21,
      page: 1,
      limit: 10,
      totalPages: 3,
    });
  });
});
