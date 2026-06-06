// Contrato alineado con el backend "Historical Atlas" (años Int, sin
// facciones; el bando vive como string en cada comandante).

export type BattleType = 'BATTLE' | 'SIEGE' | 'CAMPAIGN'

// Filtros que acepta GET /battles y GET /battles/points.
export interface BattleQuery {
  page?: number
  pageSize?: number
  search?: string
  yearMin?: number
  yearMax?: number
  minImportance?: number
  // Bounding box del mapa.
  bboxN?: number
  bboxS?: number
  bboxE?: number
  bboxW?: number
}

export interface BattleSummary {
  id: string
  name: string
  slug: string
  year: number | null
  startYear: number | null
  endYear: number | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  type: BattleType
  importanceScore: number
}

// Punto ligero para el mapa (GET /battles/points).
export interface BattlePoint {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
  year: number | null
  type: BattleType
  importanceScore: number
}

export interface BattleDetail {
  id: string
  name: string
  slug: string
  year: number | null
  startYear: number | null
  endYear: number | null
  date: string | null // "YYYY-MM-DD" si hay día exacto
  startDate: string | null
  endDate: string | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  wikipediaUrl: string | null
  summary: string | null
  type: BattleType
  importanceScore: number
  hasAiStory: boolean
}
