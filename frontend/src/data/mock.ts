export type BattleType = 'land' | 'naval' | 'air' | 'siege'
export type BattleResult = 'victory' | 'defeat' | 'draw' | 'inconclusive'

export interface Battle {
  id: string
  name: string
  war: string
  date: string
  dateLabel: string
  place: string
  lat: number
  lon: number
  type: BattleType
  era: string
  result: BattleResult
  resultLabel: string
  forces: string
  casualties: string
  winnerColor: string
  loserColor: string
}

export interface Commander {
  id: string
  name: string
  country: string
  years: string
  battles: number
  victories: number
  defeats: number
  role: string
}

export interface War {
  id: string
  name: string
  period: string
  durationDays: number
  battles: number
  casualties: string
  summary: string
}

export interface Era {
  key: string
  label: string
  range: string
}

export const battles: Battle[] = [
  { id: 'waterloo', name: 'Batalla de Waterloo', war: 'Guerra de los Cien Días', date: '1815-06-18', dateLabel: '18 jun 1815', place: 'Waterloo, Bélgica', lat: 50.6804, lon: 4.4124, type: 'land', era: 'XIX', result: 'defeat', resultLabel: 'Derrota francesa', forces: '72.000 vs 118.000', casualties: '62.000', winnerColor: '#1B3A8A', loserColor: '#1F4D2C' },
  { id: 'stalingrado', name: 'Batalla de Stalingrado', war: 'Segunda Guerra Mundial', date: '1942-08-23', dateLabel: '23 ago 1942 — 2 feb 1943', place: 'Volgogrado, URSS', lat: 48.7080, lon: 44.5133, type: 'land', era: 'XX', result: 'victory', resultLabel: 'Victoria soviética', forces: '1.143.500 vs 1.040.000', casualties: '~2.000.000', winnerColor: '#9B1B1B', loserColor: '#1F1F1F' },
  { id: 'lepanto', name: 'Batalla de Lepanto', war: 'Guerra de Chipre', date: '1571-10-07', dateLabel: '7 oct 1571', place: 'Golfo de Patras, Grecia', lat: 38.2333, lon: 21.4500, type: 'naval', era: 'XVI', result: 'victory', resultLabel: 'Victoria de la Liga Santa', forces: '212 galeras vs 251', casualties: '~40.000', winnerColor: '#C0392B', loserColor: '#1B5E20' },
  { id: 'agincourt', name: 'Batalla de Agincourt', war: 'Guerra de los Cien Años', date: '1415-10-25', dateLabel: '25 oct 1415', place: 'Azincourt, Francia', lat: 50.4642, lon: 2.1417, type: 'land', era: 'XV', result: 'victory', resultLabel: 'Victoria inglesa', forces: '8.000 vs 24.000', casualties: '~10.000', winnerColor: '#9B1B1B', loserColor: '#1B3A8A' },
  { id: 'gaugamela', name: 'Batalla de Gaugamela', war: 'Conquistas de Alejandro Magno', date: '-331-10-01', dateLabel: '1 oct 331 a. C.', place: 'Erbil, Irak', lat: 36.1900, lon: 44.0094, type: 'land', era: 'Antigüedad', result: 'victory', resultLabel: 'Victoria macedonia', forces: '47.000 vs 100.000+', casualties: '~50.000', winnerColor: '#B8860B', loserColor: '#5E2F0E' },
  { id: 'midway', name: 'Batalla de Midway', war: 'Guerra del Pacífico', date: '1942-06-04', dateLabel: '4–7 jun 1942', place: 'Atolón Midway, Pacífico', lat: 28.2072, lon: -177.3735, type: 'naval', era: 'XX', result: 'victory', resultLabel: 'Victoria estadounidense', forces: '3 portaaviones vs 4', casualties: '3.057', winnerColor: '#1B3A8A', loserColor: '#9B1B1B' },
  { id: 'cannae', name: 'Batalla de Cannas', war: 'Segunda Guerra Púnica', date: '-216-08-02', dateLabel: '2 ago 216 a. C.', place: 'Canne della Battaglia, Italia', lat: 41.3061, lon: 16.1308, type: 'land', era: 'Antigüedad', result: 'victory', resultLabel: 'Victoria cartaginesa', forces: '50.000 vs 86.000', casualties: '~67.500', winnerColor: '#5E2F0E', loserColor: '#9B1B1B' },
  { id: 'trafalgar', name: 'Batalla de Trafalgar', war: 'Guerras Napoleónicas', date: '1805-10-21', dateLabel: '21 oct 1805', place: 'Cabo de Trafalgar, España', lat: 36.1833, lon: -6.0333, type: 'naval', era: 'XIX', result: 'victory', resultLabel: 'Victoria británica', forces: '27 navíos vs 33', casualties: '~17.000', winnerColor: '#1B3A8A', loserColor: '#9B1B1B' },
  { id: 'bretana', name: 'Batalla de Inglaterra', war: 'Segunda Guerra Mundial', date: '1940-07-10', dateLabel: '10 jul – 31 oct 1940', place: 'Espacio aéreo británico', lat: 51.5072, lon: -0.1276, type: 'air', era: 'XX', result: 'victory', resultLabel: 'Victoria británica', forces: '1.963 aeronaves vs 2.550', casualties: '~3.500', winnerColor: '#1B3A8A', loserColor: '#1F1F1F' },
  { id: 'constantinopla', name: 'Caída de Constantinopla', war: 'Guerras Bizantino-Otomanas', date: '1453-05-29', dateLabel: '29 may 1453', place: 'Estambul, Turquía', lat: 41.0082, lon: 28.9784, type: 'siege', era: 'XV', result: 'victory', resultLabel: 'Victoria otomana', forces: '7.000 vs 80.000', casualties: '~20.000', winnerColor: '#1B5E20', loserColor: '#5E2F0E' },
  { id: 'somme', name: 'Batalla del Somme', war: 'Primera Guerra Mundial', date: '1916-07-01', dateLabel: '1 jul – 18 nov 1916', place: 'Somme, Francia', lat: 49.9000, lon: 2.6000, type: 'land', era: 'XX', result: 'inconclusive', resultLabel: 'Resultado indeciso', forces: '~390.000 vs 315.000', casualties: '~1.120.000', winnerColor: '#1B3A8A', loserColor: '#1F1F1F' },
  { id: 'austerlitz', name: 'Batalla de Austerlitz', war: 'Guerras Napoleónicas', date: '1805-12-02', dateLabel: '2 dic 1805', place: 'Slavkov u Brna, Chequia', lat: 49.1551, lon: 16.7547, type: 'land', era: 'XIX', result: 'victory', resultLabel: 'Victoria francesa', forces: '68.000 vs 84.000', casualties: '~24.000', winnerColor: '#1B3A8A', loserColor: '#5E2F0E' },
  { id: 'normandia', name: 'Desembarco de Normandía', war: 'Segunda Guerra Mundial', date: '1944-06-06', dateLabel: '6 jun 1944', place: 'Normandía, Francia', lat: 49.4144, lon: -0.7944, type: 'land', era: 'XX', result: 'victory', resultLabel: 'Victoria aliada', forces: '156.000 vs 50.350', casualties: '~22.000', winnerColor: '#1B3A8A', loserColor: '#1F1F1F' },
  { id: 'salamina', name: 'Batalla de Salamina', war: 'Segunda Guerra Médica', date: '-480-09-22', dateLabel: '22 sep 480 a. C.', place: 'Estrecho de Salamina, Grecia', lat: 37.9580, lon: 23.5160, type: 'naval', era: 'Antigüedad', result: 'victory', resultLabel: 'Victoria griega', forces: '378 trirremes vs 800', casualties: '~40.000', winnerColor: '#1B3A8A', loserColor: '#5E2F0E' },
  { id: 'gettysburg', name: 'Batalla de Gettysburg', war: 'Guerra Civil Estadounidense', date: '1863-07-01', dateLabel: '1–3 jul 1863', place: 'Gettysburg, Pensilvania', lat: 39.8067, lon: -77.2389, type: 'land', era: 'XIX', result: 'victory', resultLabel: 'Victoria de la Unión', forces: '93.921 vs 71.699', casualties: '~51.000', winnerColor: '#1B3A8A', loserColor: '#5E2F0E' },
  { id: 'tours', name: 'Batalla de Poitiers', war: 'Conquistas Omeyas', date: '0732-10-10', dateLabel: '10 oct 732', place: 'Poitiers, Francia', lat: 46.5802, lon: 0.3404, type: 'land', era: 'Medieval', result: 'victory', resultLabel: 'Victoria franca', forces: '20.000 vs 25.000', casualties: '~13.000', winnerColor: '#5E2F0E', loserColor: '#1B5E20' },
  { id: 'tsushima', name: 'Batalla de Tsushima', war: 'Guerra Ruso-Japonesa', date: '1905-05-27', dateLabel: '27–28 may 1905', place: 'Estrecho de Tsushima', lat: 34.7, lon: 129.5, type: 'naval', era: 'XX', result: 'victory', resultLabel: 'Victoria japonesa', forces: '89 buques vs 38', casualties: '~5.000', winnerColor: '#9B1B1B', loserColor: '#1B3A8A' },
  { id: 'verdun', name: 'Batalla de Verdún', war: 'Primera Guerra Mundial', date: '1916-02-21', dateLabel: '21 feb – 18 dic 1916', place: 'Verdún, Francia', lat: 49.1593, lon: 5.3850, type: 'land', era: 'XX', result: 'victory', resultLabel: 'Victoria francesa', forces: '~1.140.000 vs 1.250.000', casualties: '~700.000', winnerColor: '#1B3A8A', loserColor: '#1F1F1F' },
]

export const commanders: Commander[] = [
  { id: 'napoleon', name: 'Napoleón Bonaparte', country: 'Francia', years: '1769–1821', battles: 60, victories: 53, defeats: 7, role: 'Emperador y comandante en jefe' },
  { id: 'wellington', name: 'Arthur Wellesley, Duque de Wellington', country: 'Reino Unido', years: '1769–1852', battles: 32, victories: 30, defeats: 2, role: 'Mariscal de campo' },
  { id: 'cesar', name: 'Cayo Julio César', country: 'República Romana', years: '100 a. C.– 44 a. C.', battles: 51, victories: 47, defeats: 4, role: 'Procónsul, Dictador' },
  { id: 'alejandro', name: 'Alejandro Magno', country: 'Macedonia', years: '356 a. C.– 323 a. C.', battles: 23, victories: 23, defeats: 0, role: 'Rey de Macedonia' },
  { id: 'zhukov', name: 'Gueorgui Zhúkov', country: 'URSS', years: '1896–1974', battles: 18, victories: 16, defeats: 2, role: 'Mariscal de la Unión Soviética' },
  { id: 'anibal', name: 'Aníbal Barca', country: 'Cartago', years: '247 a. C.– 183 a. C.', battles: 19, victories: 14, defeats: 5, role: 'General cartaginés' },
  { id: 'rommel', name: 'Erwin Rommel', country: 'Alemania', years: '1891–1944', battles: 24, victories: 17, defeats: 7, role: 'Mariscal de campo' },
  { id: 'nelson', name: 'Horatio Nelson', country: 'Reino Unido', years: '1758–1805', battles: 14, victories: 13, defeats: 1, role: 'Vicealmirante' },
]

export const wars: War[] = [
  { id: 'wwii', name: 'Segunda Guerra Mundial', period: '1939 — 1945', durationDays: 2194, battles: 412, casualties: '~70 millones', summary: 'El conflicto armado más amplio y mortífero de la historia, con teatros de operaciones en Europa, Asia, África y el Pacífico.' },
  { id: 'napoleonicas', name: 'Guerras Napoleónicas', period: '1803 — 1815', durationDays: 4380, battles: 84, casualties: '~6.500.000', summary: 'Serie de conflictos protagonizados por la Francia napoleónica contra coaliciones europeas sucesivas. Redibujaron el mapa político del continente.' },
  { id: 'wwi', name: 'Primera Guerra Mundial', period: '1914 — 1918', durationDays: 1568, battles: 96, casualties: '~20 millones', summary: 'Conflicto industrial total que marcó el fin del orden imperial europeo y el inicio del siglo XX moderno.' },
]

export const eras: Era[] = [
  { key: 'ancient', label: 'Antigüedad', range: '−3000 — 476' },
  { key: 'medieval', label: 'Edad Media', range: '476 — 1453' },
  { key: 'modern', label: 'Edad Moderna', range: '1453 — 1789' },
  { key: 'contemporary', label: 'Edad Contemporánea', range: '1789 — hoy' },
]
