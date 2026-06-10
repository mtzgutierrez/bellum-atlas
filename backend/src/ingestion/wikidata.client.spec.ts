import { WikidataClient } from './wikidata.client';

// Mockeamos global.fetch para ejercitar el parsing (parseCoords, yearFrom,
// dayDate, qidOf, classifyBattle, mergeBattle) sin red.
describe('WikidataClient', () => {
  let client: WikidataClient;
  const realFetch = global.fetch;

  beforeEach(() => {
    client = new WikidataClient();
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  const jsonRes = (body: unknown) =>
    ({ ok: true, status: 200, json: async () => body }) as Response;

  describe('fetchBattle', () => {
    it('parsea coords, año, fecha exacta, tipo y sitelinks', async () => {
      global.fetch = jest.fn((url: string | URL | Request) => {
        const u = String(url);
        if (u.includes('/sparql')) {
          return Promise.resolve(
            jsonRes({
              results: {
                bindings: [
                  {
                    itemLabel: { type: 'literal', value: 'Batalla de Lepanto' },
                    date: { value: '1571-10-07T00:00:00Z' },
                    datePrec: { value: '11' },
                    coords: { value: 'Point(38.18 38.0)' },
                    instance: {
                      value: 'http://www.wikidata.org/entity/Q178561',
                    },
                    article: {
                      value: 'https://es.wikipedia.org/wiki/Batalla_de_Lepanto',
                    },
                  },
                ],
              },
            }),
          );
        }
        // wbgetentities (sitelinks)
        return Promise.resolve(
          jsonRes({
            entities: { Q165425: { sitelinks: { eswiki: {}, enwiki: {} } } },
          }),
        );
      }) as never;

      const b = await client.fetchBattle('Q165425');

      expect(b).toMatchObject({
        qid: 'Q165425',
        name: 'Batalla de Lepanto',
        year: 1571,
        date: '1571-10-07',
        latitude: 38.0,
        longitude: 38.18,
        type: 'BATTLE',
        sitelinkCount: 2,
        wikipediaUrl: 'https://es.wikipedia.org/wiki/Batalla_de_Lepanto',
      });
    });

    it('devuelve null si SPARQL no trae filas', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(jsonRes({ results: { bindings: [] } })),
      ) as never;
      expect(await client.fetchBattle('Q1')).toBeNull();
    });

    it('precisión < día deja date en null pero conserva el año', async () => {
      global.fetch = jest.fn((url: string | URL | Request) => {
        if (String(url).includes('/sparql')) {
          return Promise.resolve(
            jsonRes({
              results: {
                bindings: [
                  {
                    itemLabel: { value: 'Batalla X' },
                    date: { value: '1066-01-01T00:00:00Z' },
                    datePrec: { value: '9' }, // año, no día
                    instance: {
                      value: 'http://www.wikidata.org/entity/Q188055',
                    },
                  },
                ],
              },
            }),
          );
        }
        return Promise.resolve(jsonRes({ entities: {} }));
      }) as never;

      const b = await client.fetchBattle('Q1');
      expect(b?.year).toBe(1066);
      expect(b?.date).toBeNull();
      expect(b?.type).toBe('SIEGE'); // Q188055
      expect(b?.sitelinkCount).toBe(0);
    });
  });

  describe('fetchBattlesPage', () => {
    it('consolida filas multivaluadas del mismo item', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(
          jsonRes({
            results: {
              bindings: [
                {
                  item: { value: 'http://www.wikidata.org/entity/Q2' },
                  itemLabel: { value: 'Asedio Y' },
                  instance: { value: 'http://www.wikidata.org/entity/Q178561' },
                  linkcount: { value: '10' },
                },
                {
                  item: { value: 'http://www.wikidata.org/entity/Q2' },
                  itemLabel: { value: 'Asedio Y' },
                  instance: { value: 'http://www.wikidata.org/entity/Q188055' },
                  coords: { value: 'Point(2.0 41.0)' },
                  linkcount: { value: '10' },
                },
              ],
            },
          }),
        ),
      ) as never;

      const rows = await client.fetchBattlesPage(50, 0);
      expect(rows).toHaveLength(1);
      // mergeBattle prioriza el tipo específico (SIEGE) sobre BATTLE.
      expect(rows[0]).toMatchObject({
        qid: 'Q2',
        type: 'SIEGE',
        latitude: 41.0,
        longitude: 2.0,
        sitelinkCount: 10,
      });
    });
  });
});
