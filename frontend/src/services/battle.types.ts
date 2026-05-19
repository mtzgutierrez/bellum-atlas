export type BattleType = 'LAND' | 'NAVAL' | 'AIR' | 'SIEGE' | 'MIXED'

export interface BattleSummary {
  id: string
  name: string
  slug: string
  date: string | null
  dateStart: string | null
  dateEnd: string | null
  locationName: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  type: BattleType | null
  imageUrl: string | null
  wikipediaUrl: string | null
}

export interface BattleWarRef {
  id: string
  name: string
  slug: string
}

export interface BattleCommanderRef {
  id: string
  name: string
  slug: string
}

export interface BattleFaction {
  id: string
  name: string
  slug: string
  flagUrl: string | null
  side: number | null
  outcome: string | null
  strength: number | null
  deaths: number | null
  injured: number | null
  commanders: BattleCommanderRef[]
}

export interface BattleMedia {
  id: string
  url: string
  type: string
  caption: string | null
}

export interface BattleDetail {
  id: string
  name: string
  slug: string
  description: string | null
  summary: string | null
  date: string | null
  dateStart: string | null
  dateEnd: string | null
  locationName: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  deaths: number | null
  casualties: number | null
  imageUrl: string | null
  mapImageUrl: string | null
  wikipediaUrl: string | null
  type: string | null
  wars: BattleWarRef[]
  factions: BattleFaction[]
  media: BattleMedia[]
}

export interface CoordinatesQuery {
  latitude: number
  longitude: number
  radius: number
}

export interface TimePeriodQuery {
  startDate: string
  endDate: string
}
