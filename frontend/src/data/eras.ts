// Filtros de época predeterminados: cada uno es un rango de años (Int) que se
// pasa como yearMin/yearMax a GET /battles.
//
// IMPORTANTE: ningún preset supera los 150 años de lapso. El backend rechaza
// rangos mayores (MAX_YEAR_SPAN) para evitar cargas masivas y lentitud.

export interface Era {
  key: string
  label: string
  startYear: number
  endYear: number
}

export const MAX_YEAR_SPAN = 150

export const eras: Era[] = [
  { key: 's-xxi', label: 'Siglo XXI', startYear: 2000, endYear: new Date().getFullYear() },
  { key: 's-xx', label: 'Siglo XX', startYear: 1900, endYear: 2000 },
  { key: 's-xix', label: 'Siglo XIX', startYear: 1800, endYear: 1900 },
  { key: 's-xviii', label: 'Siglo XVIII', startYear: 1700, endYear: 1800 },
  { key: 's-xvii', label: 'Siglo XVII', startYear: 1600, endYear: 1700 },
  { key: 's-xvi', label: 'Siglo XVI', startYear: 1500, endYear: 1600 },
  { key: 'baja-em', label: 'Baja Edad Media', startYear: 1350, endYear: 1500 },
  { key: 'plena-em', label: 'Plena Edad Media', startYear: 1200, endYear: 1350 },
  { key: 'alta-em', label: 'Alta Edad Media', startYear: 1050, endYear: 1200 },
  { key: 's-ix-xi', label: 'Siglos IX–XI', startYear: 900, endYear: 1050 },
  { key: 'roma', label: 'Antigüedad clásica', startYear: -150, endYear: 0 },
  { key: 'grecia', label: 'Grecia clásica', startYear: -500, endYear: -350 },
]
