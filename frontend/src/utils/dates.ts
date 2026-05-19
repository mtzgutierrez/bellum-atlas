// Formato español: DD-MM-AAAA. Años de 1-3 cifras sin ceros de relleno.
// Añade "AC" (antes de Cristo) para años negativos y "DC" (después de Cristo)
// para años AD anteriores al año 1000 para que sean inequívocos.

interface ParsedDate {
  year: number
  month: number
  day: number
}

// Parsea ISO 8601 extendido, soportando años negativos (`-0480-09-22T...`)
// y de cualquier número de dígitos (`-12345-...`).
function parseIso(iso: string): ParsedDate | null {
  const m = iso.match(/^(-?\d+)-(\d{2})-(\d{2})/)
  if (!m) return null
  const year = Number.parseInt(m[1], 10)
  const month = Number.parseInt(m[2], 10)
  const day = Number.parseInt(m[3], 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }
  return { year, month, day }
}

function yearSuffix(year: number): string {
  if (year <= 0) return ' AC'
  if (year < 1000) return ' DC'
  return ''
}

// Año sin ceros a la izquierda; en negativo se muestra como positivo + AC.
function yearLabel(year: number): string {
  const abs = Math.abs(year === 0 ? 1 : year)
  return `${abs}${yearSuffix(year)}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const p = parseIso(iso)
  if (!p) return '—'
  const dd = String(p.day).padStart(2, '0')
  const mm = String(p.month).padStart(2, '0')
  return `${dd}-${mm}-${yearLabel(p.year)}`
}

export function formatYear(iso: string | null | undefined): string {
  if (!iso) return '—'
  const p = parseIso(iso)
  if (!p) return '—'
  return yearLabel(p.year)
}

// "07-10-1571" o "01-07-1863 — 03-07-1863" según haya rango o no.
export function formatDateRange(
  date: string | null | undefined,
  dateStart: string | null | undefined,
  dateEnd: string | null | undefined,
): string {
  if (date) return formatDate(date)
  if (dateStart && dateEnd) return `${formatDate(dateStart)} — ${formatDate(dateEnd)}`
  if (dateStart) return formatDate(dateStart)
  if (dateEnd) return formatDate(dateEnd)
  return '—'
}

export function formatYearRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return '—'
  const s = start ? formatYear(start) : '?'
  const e = end ? formatYear(end) : '?'
  if (s === e) return s
  return `${s} — ${e}`
}
