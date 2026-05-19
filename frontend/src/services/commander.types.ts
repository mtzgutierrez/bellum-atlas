export interface CommanderSummary {
  id: string
  name: string
  slug: string
  birthDate: string | null
  deathDate: string | null
  nationality: string | null
  imageUrl: string | null
  wikipediaUrl: string | null
}

export interface CommanderRank {
  id: string
  name: string
  wikidataId: string | null
  dateStart: string | null
  dateEnd: string | null
}

export interface CommanderWarRef {
  id: string
  name: string
  slug: string
}

export interface CommanderBattleRef {
  id: string
  name: string
  slug: string
  date: string | null
  factionName: string | null
}

export interface CommanderDetail {
  id: string
  name: string
  slug: string
  description: string | null
  summary: string | null
  aliases: string[]
  birthDate: string | null
  birthPlace: string | null
  deathDate: string | null
  deathPlace: string | null
  causeOfDeath: string | null
  nationality: string | null
  imageUrl: string | null
  wikipediaUrl: string | null
  ranks: CommanderRank[]
  wars: CommanderWarRef[]
  battles: CommanderBattleRef[]
}

export interface CommanderYearsQuery {
  startYear: number
  endYear: number
}
