import { Test, TestingModule } from '@nestjs/testing';
import { WikidataRepository } from './wikidata.repository';
import { WikidataService } from './wikidata.service';
import { WikipediaService } from './wikipedia.service';

describe('WikidataService', () => {
  let service: WikidataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikidataService,
        { provide: WikidataRepository, useValue: {} },
        { provide: WikipediaService, useValue: {} },
      ],
    }).compile();

    service = module.get<WikidataService>(WikidataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
