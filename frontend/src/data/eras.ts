// Filtros de época predeterminados: cada uno es un rango de años que se usa
// para llamar a /time-period en el backend.

export interface Era {
  key: string
  label: string
  startYear: number
  endYear: number
}

export const eras: Era[] = [
  { key: 'antiguedad', label: 'Antigüedad', startYear: -3000, endYear: 476 },
  { key: 'medieval', label: 'Edad Media', startYear: 476, endYear: 1453 },
  { key: 'moderna', label: 'Edad Moderna', startYear: 1453, endYear: 1789 },
  { key: 'contemporanea', label: 'Edad Contemporánea', startYear: 1789, endYear: new Date().getFullYear() },
  { key: 's-xx', label: 'Siglo XX', startYear: 1900, endYear: 2000 },
  { key: 's-xix', label: 'Siglo XIX', startYear: 1800, endYear: 1900 },
]

// Convierte un año (que puede ser negativo para a.C.) a fecha ISO. Postgres
// soporta BCE pero su parseo del lado JS es delicado; pasamos como string.
export function yearToIsoStart(year: number): string {
  return `${pad(year)}-01-01T00:00:00.000Z`
}

export function yearToIsoEnd(year: number): string {
  return `${pad(year)}-12-31T23:59:59.999Z`
}

function pad(year: number): string {
  if (year >= 0) return String(year).padStart(4, '0')
  return `-${String(-year).padStart(6, '0')}`
}
