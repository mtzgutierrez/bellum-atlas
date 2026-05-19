import { Injectable } from '@nestjs/common';

/**
 * Servicio para llamar a la Api de Wikidata.
 * Aquí residen las consultas que nutren a la base de
 * datos.
 */
@Injectable()
export class WikidataService {
  async fetchAllBattles() {
    // Aquí iría la lógica para consultar la API de Wikidata
    // y obtener los datos de las batallas.
  }

  async fetchAllWars() {
    // Aquí iría la lógica para consultar la API de Wikidata
    // y obtener los datos de las guerras.
  }

  async fetchAllCommanders() {
    // Aquí iría la lógica para consultar la API de Wikidata
    // y obtener los datos de los comandantes.
  }
}
