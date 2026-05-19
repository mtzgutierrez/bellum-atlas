import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import { useApiFetch } from '../hooks/useApiFetch'
import { useDebounce } from '../hooks/useDebounce'
import { warService } from '../services/war.service'
import type { WarSummary } from '../services/war.types'
import { formatYearRange } from '../utils/dates'

export default function Wars() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(q, 300)

  const fetcher = useCallback(() => {
    const text = debounced.trim()
    if (text.length >= 2) {
      return warService.buscarPorNombre(text, { page, pageSize: 50 })
    }
    return warService.listar({ page, pageSize: 50 })
  }, [debounced, page])

  const { data, loading } = useApiFetch(fetcher, [debounced, page])
  const items = data?.data ?? []
  const meta = data?.meta

  return (
    <main className="catalog">
      <header className="catalog-head">
        <div className="catalog-eyebrow">Archivo</div>
        <h1 className="catalog-title">Guerras</h1>
      </header>

      <div className="catalog-toolbar">
        <div className="input-with-icon" style={{ flex: '1 1 280px', maxWidth: 340 }}>
          <Icon name="search" size={16} />
          <input
            className="input"
            type="text"
            placeholder="Buscar guerra"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="war-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, marginBottom: 1 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="catalog-empty">Sin registros para esta consulta.</div>
      ) : (
        <>
          <div className="war-list">
            {items.map((w) => (
              <WarRow key={w.id} war={w} onOpen={() => navigate(`/wars/${w.slug}`)} />
            ))}
          </div>
          {meta && meta.totalPages > 1 && <Pagination meta={meta} onPage={setPage} />}
        </>
      )}
    </main>
  )
}

function WarRow({ war, onOpen }: { war: WarSummary; onOpen: () => void }) {
  return (
    <div className="war-list-row" onClick={onOpen}>
      <div>
        <div className="name">{war.name}</div>
      </div>
      <div className="dates">{formatYearRange(war.dateStart, war.dateEnd)}</div>
      <Icon name="chevron-right" size={16} />
    </div>
  )
}
