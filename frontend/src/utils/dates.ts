// El backend trabaja con AÑOS (Int), no con fechas exactas. Estas utilidades
// formatean años: negativos → "AC" (antes de Cristo), 1-999 → "DC" para que
// sean inequívocos, ≥1000 → tal cual.

function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} AC`
  if (year === 0) return '1 AC'
  if (year < 1000) return `${year} DC`
  return String(year)
}

// Un solo año. `formatYear(1571)` → "1571".
export function formatYear(year: number | null | undefined): string {
  if (year == null || !Number.isFinite(year)) return '—'
  return yearLabel(year)
}

// Rango de años. Prioriza el rango [start, end]; si sólo hay un valor, lo usa.
// `formatYearRange(1942, 1943)` → "1942 — 1943".
export function formatYearRange(
  start: number | null | undefined,
  end: number | null | undefined,
): string {
  const hasStart = start != null && Number.isFinite(start)
  const hasEnd = end != null && Number.isFinite(end)
  if (!hasStart && !hasEnd) return '—'
  if (hasStart && hasEnd) {
    return start === end ? yearLabel(start!) : `${yearLabel(start!)} — ${yearLabel(end!)}`
  }
  return yearLabel((hasStart ? start : end) as number)
}

// Para una batalla: usa `year` si existe, si no el rango [startYear, endYear].
export function formatBattleYears(b: {
  year: number | null
  startYear: number | null
  endYear: number | null
}): string {
  if (b.year != null) return formatYear(b.year)
  return formatYearRange(b.startYear, b.endYear)
}

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

// "1805-10-21" → "21 oct 1805"; "-0480-09-22" → "22 sep 480 AC".
export function formatExactDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const m = iso.match(/^(-?)(\d{1,})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const bc = m[1] === '-'
  const year = Number(m[2])
  const month = Number(m[3])
  const day = Number(m[4])
  if (month < 1 || month > 12) return null
  return `${day} ${MESES[month - 1]} ${year}${bc ? ' AC' : ''}`
}

// Fechas de una batalla con el mayor detalle disponible:
//   día exacto de inicio/fin > un solo día > rango de años > año.
export function formatBattleDates(b: {
  year: number | null
  startYear: number | null
  endYear: number | null
  date: string | null
  startDate: string | null
  endDate: string | null
}): string {
  const start = formatExactDate(b.startDate)
  const end = formatExactDate(b.endDate)
  if (start && end) return `${start} — ${end}`
  const single = formatExactDate(b.date)
  if (single) return single
  if (start) return start
  if (end) return end
  return formatBattleYears(b)
}
