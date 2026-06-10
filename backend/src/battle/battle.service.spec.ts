import { NotFoundException } from '@nestjs/common';
import { BattleService } from './battle.service';
import { BattleRepository } from './battle.repository';
import * as wikipediaSource from '../ai/wikipedia-source';

jest.mock('../ai/wikipedia-source');

describe('BattleService', () => {
  let service: BattleService;
  let repo: jest.Mocked<
    Pick<
      BattleRepository,
      'findArticleSource' | 'saveArticle' | 'findPaginated' | 'count'
    >
  >;
  const fetchArticleText = wikipediaSource.fetchArticleText as jest.Mock;

  beforeEach(() => {
    repo = {
      findArticleSource: jest.fn(),
      saveArticle: jest.fn().mockResolvedValue(undefined),
      findPaginated: jest.fn(),
      count: jest.fn(),
    } as never;
    service = new BattleService(repo as unknown as BattleRepository);
    fetchArticleText.mockReset();
  });

  describe('getArticle', () => {
    it('devuelve cached:true sin tocar la red si ya hay artículo', async () => {
      repo.findArticleSource.mockResolvedValue({
        id: 'b1',
        article: 'texto cacheado',
        wikipediaUrl: 'https://es.wikipedia.org/wiki/X',
      });

      const res = await service.getArticle('b1');

      expect(res).toEqual({
        article: 'texto cacheado',
        sourceUrl: 'https://es.wikipedia.org/wiki/X',
        cached: true,
      });
      expect(fetchArticleText).not.toHaveBeenCalled();
      expect(repo.saveArticle).not.toHaveBeenCalled();
    });

    it('hace backfill y persiste cuando no está cacheado', async () => {
      repo.findArticleSource.mockResolvedValue({
        id: 'b1',
        article: null,
        wikipediaUrl: 'https://es.wikipedia.org/wiki/X',
      });
      fetchArticleText.mockResolvedValue('texto nuevo');

      const res = await service.getArticle('b1');

      expect(fetchArticleText).toHaveBeenCalledWith(
        'https://es.wikipedia.org/wiki/X',
        9000,
      );
      expect(repo.saveArticle).toHaveBeenCalledWith('b1', 'texto nuevo');
      expect(res).toEqual({
        article: 'texto nuevo',
        sourceUrl: 'https://es.wikipedia.org/wiki/X',
        cached: false,
      });
    });

    it('no persiste si el fetch no devuelve texto', async () => {
      repo.findArticleSource.mockResolvedValue({
        id: 'b1',
        article: null,
        wikipediaUrl: 'https://es.wikipedia.org/wiki/X',
      });
      fetchArticleText.mockResolvedValue(null);

      const res = await service.getArticle('b1');

      expect(repo.saveArticle).not.toHaveBeenCalled();
      expect(res.article).toBeNull();
      expect(res.cached).toBe(false);
    });

    it('404 si la batalla no existe', async () => {
      repo.findArticleSource.mockResolvedValue(null);
      await expect(service.getArticle('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('combina data y meta con el total', async () => {
      repo.findPaginated.mockResolvedValue([{ id: 'a' }] as never);
      repo.count.mockResolvedValue(1);

      const res = await service.list({}, { page: 2, pageSize: 10 });

      expect(repo.findPaginated).toHaveBeenCalledWith({}, 10, 10); // skip=(2-1)*10
      expect(res.meta).toMatchObject({ total: 1, page: 2, pageSize: 10 });
      expect(res.data).toHaveLength(1);
    });
  });
});
