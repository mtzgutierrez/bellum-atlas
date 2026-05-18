export type ApiBattleType = 'LAND' | 'NAVAL' | 'AIR' | 'SIEGE' | 'COMBINED'
export type ApiFactionResult = 'victory' | 'defeat' | 'draw' | 'inconclusive'

export interface ApiBattleListItem {
  id: string
  name: string
  slug: string
  date: string | null
  dateText: string | null
  result: string | null
  type: ApiBattleType | null
  era: { name: string; slug: string } | null
  location: { name: string; country: string; lat: number | null; lon: number | null } | null
  wars: { war: { id: string; name: string; slug: string } }[]
}

export interface ApiBattleFaction {
  id: string
  side: number
  belligerents: string | null
  result: ApiFactionResult | null
  commanders_list: string | null
  strength: string | null
  casualtiesRaw: string | null
  casualtiesMin: number | null
  casualtiesMax: number | null
  commanders: { commander: { id: string; name: string; country: string | null } }[]
}

export interface ApiBattleDetail extends ApiBattleListItem {
  factions: ApiBattleFaction[]
  media: { order: number; isPrimary: boolean; media: { url: string; altText: string | null } }[]
  relatedBattles: {
    id: string; name: string; slug: string; date: string | null
    result: string | null; type: ApiBattleType | null
  }[]
}

export interface ApiWarListItem {
  id: string
  name: string
  slug: string
  startDate: string | null
  endDate: string | null
  description: string | null
  result: string | null
  era: { name: string; slug: string } | null
  location: { name: string; country: string } | null
  _count: { battles: number }
}

export interface ApiWarFaction {
  id: string
  side: number
  belligerents: string | null
  result: ApiFactionResult | null
  casualtiesRaw: string | null
  commanders: { commander: { id: string; name: string; country: string | null } }[]
}

export interface ApiWarDetail extends ApiWarListItem {
  durationDays: number | null
  factions: ApiWarFaction[]
  battles: {
    battle: {
      id: string; name: string; slug: string
      date: string | null; result: string | null; type: ApiBattleType | null
    }
  }[]
  media: { order: number; isPrimary: boolean; media: { url: string; altText: string | null } }[]
}

export interface ApiCommanderListItem {
  id: string
  name: string
  country: string | null
  birthYear: number | null
  deathYear: number | null
  description: string | null
  _count: { battles: number }
  media: { media: { url: string; altText: string | null } }[]
}

export interface ApiCommanderDetail extends ApiCommanderListItem {
  battles: {
    battleFaction: {
      result: ApiFactionResult | null
      side: number
      battle: { id: string; name: string; slug: string; date: string | null; type: ApiBattleType | null }
    }
  }[]
  wars: {
    warFaction: {
      result: ApiFactionResult | null
      side: number
      war: { id: string; name: string; slug: string }
    }
  }[]
  media: { order: number; isPrimary: boolean; media: { url: string; altText: string | null } }[]
}

export interface ApiMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: ApiMeta
}
