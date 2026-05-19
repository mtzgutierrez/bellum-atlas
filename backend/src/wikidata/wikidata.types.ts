// DTOs intermedios devueltos por WikidataService.
// Son representaciones agnósticas al ORM: el repositorio las traduce a Prisma.

export type WikidataRef = {
  wikidataId: string;
  name: string;
};

export type WikidataFactionInBattle = {
  wikidataId: string;
  name: string;
  flagUrl: string | null;
  imageUrl: string | null;
  side: number | null;
  outcome: string | null;
  strength: number | null;
  deaths: number | null;
  injured: number | null;
  commanders: WikidataRef[];
};

export type WikidataBattle = {
  wikidataId: string;
  name: string;
  description: string | null;
  summary: string | null;
  date: Date | null;
  dateStart: Date | null;
  dateEnd: Date | null;
  locationName: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  deaths: number | null;
  casualties: number | null;
  imageUrl: string | null;
  mapImageUrl: string | null;
  wikipediaUrl: string | null;
  factions: WikidataFactionInBattle[];
  wars: WikidataRef[];
};

export type WikidataFactionInWar = {
  wikidataId: string;
  name: string;
  flagUrl: string | null;
  strength: number | null;
  deaths: number | null;
  injured: number | null;
};

export type WikidataWar = {
  wikidataId: string;
  name: string;
  description: string | null;
  summary: string | null;
  dateStart: Date | null;
  dateEnd: Date | null;
  locations: string[];
  deaths: number | null;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  battles: WikidataRef[];
  factions: WikidataFactionInWar[];
};

export type WikidataCommanderRank = {
  wikidataId: string | null;
  name: string;
  dateStart: Date | null;
  dateEnd: Date | null;
};

export type WikidataCommander = {
  wikidataId: string;
  name: string;
  description: string | null;
  summary: string | null;
  aliases: string[];
  birthDate: Date | null;
  birthPlace: string | null;
  deathDate: Date | null;
  deathPlace: string | null;
  causeOfDeath: string | null;
  nationality: string | null;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  ranks: WikidataCommanderRank[];
  wars: WikidataRef[];
};
