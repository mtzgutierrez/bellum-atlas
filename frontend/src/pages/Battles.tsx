import { useCallback, useState } from 'react'
import BattleCard from '../components/BattleCard'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import { eras, yearToIsoEnd, yearToIsoStart } from '../data/eras'
import { useApiFetch } from '../hooks/useApiFetch'
import { useDebounce } from '../hooks/useDebounce'
import { battleService } from '../services/battle.service'

export default function Battles() {
  const [q, setQ] = useState('')
  const [era, setEra] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(q, 300)

  const fetcher = useCallback(() => {
    const text = debounced.trim()
    if (text.length >= 2) {
      return battleService.buscarPorNombre(text, { page, pageSize: 50 })
    }
    if (era) {
      const found = eras.find((e) => e.key === era)
      if (found) {
        return battleService.buscarPorPeriodo(
          {
            startDate: yearToIsoStart(found.startYear),
            endDate: yearToIsoEnd(found.endYear),
          },
          { page, pageSize: 50 },
        )
      }
    }
    return battleService.listar({ page, pageSize: 50 })
  }, [debounced, era, page])

  const { data, loading } = useApiFetch(fetcher, [debounced, era, page])
  const items = data?.data ?? []
  const meta = data?.meta

  return (
    <main className="catalog">
      <header className="catalog-head">
        <div className="catalog-eyebrow">Archivo</div>
        <h1 className="catalog-title">Catálogo de batallas</h1>
      </header>

      <div className="catalog-toolbar">
        <div className="input-with-icon" style={{ flex: '1 1 280px', maxWidth: 340 }}>
          <Icon name="search" size={16} />
          <input
            className="input"
            type="text"
            placeholder="Buscar batalla"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className="select"
          value={era}
          onChange={(e) => {
            setEra(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todas las épocas</option>
          {eras.map((era) => (
            <option key={era.key} value={era.key}>
              {era.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="catalog-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 280 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="catalog-empty">Sin registros para esta consulta.</div>
      ) : (
        <>
          <div className="catalog-grid">
            {items.map((b) => (
              <BattleCard key={b.id} battle={b} />
            ))}
          </div>
          {meta && meta.totalPages > 1 && (
            <Pagination meta={meta} onPage={setPage} />
          )}
        </>
      )}
    </main>
  )
}

