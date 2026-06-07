import { useCallback, useEffect, useMemo, useState } from 'react'
import BattleRow from '../components/BattleRow'
import Pagination from '../components/Pagination'
import { useApiFetch } from '../hooks/useApiFetch'
import { battleService } from '../services/battle.service'

export default function Timeline() {
  const facetsFetcher = useCallback(() => battleService.siglos(), [])
  const { data: facets } = useApiFetch(facetsFetcher, [])

  const centuries = useMemo(
    () => (facets ?? []).filter((f) => f.count > 0),
    [facets],
  )

  const [century, setCentury] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  // Por defecto, el siglo con más batallas (suele ser el XX).
  useEffect(() => {
    if (century == null && centuries.length > 0) {
      const top = centuries.reduce((a, b) => (b.count > a.count ? b : a))
      // Avoid calling setState synchronously inside the effect body to prevent
      // cascading renders — schedule it on the next macrotask.
      setTimeout(() => setCentury(top.century), 0)
    }
  }, [centuries, century])

  const range = century != null ? centuryRange(century) : null

  const listFetcher = useCallback(() => {
    if (!range) return Promise.resolve(null)
    return battleService.listar({
      yearMin: range.yearMin,
      yearMax: range.yearMax,
      sort: 'year',
      page,
      pageSize: 24,
    })
  }, [range?.yearMin, range?.yearMax, page])

  const { data, loading } = useApiFetch(listFetcher, [range?.yearMin, range?.yearMax, page])
  const items = data?.data ?? []
  const meta = data?.meta

  return (
    <main className="catalog">
      <header className="catalog-head">
        <div className="catalog-eyebrow">Archivo</div>
        <h1 className="catalog-title">Cronología</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Elige un siglo para explorar sus batallas.
        </p>
      </header>

      {/* Selector de siglos (sólo los que tienen batallas) */}
      <div className="century-picker">
        {centuries.map((f) => (
          <button
            key={f.century}
            className={`century-chip ${century === f.century ? 'active' : ''}`}
            onClick={() => {
              setCentury(f.century)
              setPage(1)
            }}
          >
            {centuryLabel(f.century)}
            <span className="century-chip-count">{f.count}</span>
          </button>
        ))}
      </div>

      {century != null && (
        <div className="timeline-current">
          <span className="timeline-dot" />
          <h2>{centuryLabel(century)}</h2>
          <span className="rule" />
          {meta && <span className="timeline-count">{meta.total}</span>}
        </div>
      )}

      {loading ? (
        <div className="catalog-rows">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 132 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="catalog-empty">Sin batallas registradas en este siglo.</div>
      ) : (
        <>
          <div className="catalog-rows">
            {items.map((b) => (
              <BattleRow key={b.id} battle={b} />
            ))}
          </div>
          {meta && meta.totalPages > 1 && <Pagination meta={meta} onPage={setPage} />}
        </>
      )}
    </main>
  )
}

// Rango de años de un siglo (negativo = a.C.).
function centuryRange(c: number): { yearMin: number; yearMax: number } {
  if (c > 0) return { yearMin: (c - 1) * 100 + 1, yearMax: c * 100 }
  const k = Math.abs(c)
  return { yearMin: -(k * 100), yearMax: -((k - 1) * 100 + 1) }
}

function centuryLabel(c: number): string {
  const roman = toRoman(Math.abs(c))
  return c < 0 ? `Siglo ${roman} a.C.` : `Siglo ${roman}`
}

function toRoman(n: number): string {
  const table: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'],
    [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'],
    [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  let rest = n
  for (const [v, s] of table) {
    while (rest >= v) {
      out += s
      rest -= v
    }
  }
  return out || 'I'
}
