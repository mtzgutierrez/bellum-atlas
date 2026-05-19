import { Injectable } from '@nestjs/common';
import { Battle, Commander, War } from '@prisma/client';

/**
 * Servicio para llamar a la Api de Wikidata.
 * Aquí residen las consultas que nutren a la base de
 * datos.
 */
@Injectable()
export class WikidataService {
  private readonly ENDPOINT = 'https://query.wikidata.org/sparql';
  private readonly PAGE_SIZE = 500;

  async fetchAllBattles(): Promise<Battle[]> {
    const all: Battle[] = [];
    let offset = 0;

    while (true) {
      const sparql = `
            SELECT ?battle ?battleLabel ?warLabel ?start ?end ?locationLabel ?article WHERE {
               

            }
        
        `;
    }

    return all;
  }

  async fetchAllWars(): Promise<War[]> {
    const all: War[] = [];
    // Aquí iría la lógica para consultar la API de Wikidata
    // y obtener los datos de las guerras.
    return all;
  }

  async fetchAllCommanders(): Promise<Commander[]> {
    const all: Commander[] = [];
    // Aquí iría la lógica para consultar la API de Wikidata
    // y obtener los datos de los comandantes.
    return all;
  }
}
