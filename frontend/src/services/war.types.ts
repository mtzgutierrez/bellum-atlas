export interface WarSummary {
  id: string
  name: string
  slug: string
  dateStart: string | null
  dateEnd: string | null
  imageUrl: string | null
  wikipediaUrl: string | null
}

export interface WarBattleRef {
  id: string
  name: string
  slug: string
  date: string | null
  dateStart: string | null
  dateEnd: string | null
}

export interface WarCommanderRef {
  id: string
  name: string
  slug: string
}

export interface WarFaction {
  id: string
  name: string
  slug: string
  flagUrl: string | null
  side: number | null
  outcome: string | null
  strength: number | null
  deaths: number | null
  injured: number | null
}

export interface WarDetail {
  id: string
  name: string
  slug: string
  description: string | null
  summary: string | null
  dateStart: string | null
  dateEnd: string | null
  locations: string[]
  deaths: number | null
  imageUrl: string | null
  wikipediaUrl: string | null
  battles: WarBattleRef[]
  factions: WarFaction[]
  commanders: WarCommanderRef[]
}

export interface WarTimePeriodQuery {
  startDate: string
  endDate: string
}
