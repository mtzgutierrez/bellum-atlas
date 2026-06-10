import { useCallback, useState } from 'react'
import BattleRow from '../components/BattleRow'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import { eras } from '../data/eras'
import { useApiFetch } from '../hooks/useApiFetch'
import { useDebounce } from '../hooks/useDebounce'
import { battleService } from '../services/battle.service'
import type { BattleSort, BattleType } from '../services/battle.types'

export default function Battles() {
  const [q, setQ] = useState('')
  const [era, setEra] = useState('')
  const [type, setType] = useState<'' | BattleType>('')
  const [sort, setSort] = useState<BattleSort>('importance')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(q, 300)

  const fetcher = useCallback(() => {
    const text = debounced.trim()
    const found = era ? eras.find((e) => e.key === era) : undefined
    return battleService.listar({
      page,
      pageSize: 40,
      search: text.length >= 2 ? text : undefined,
      yearMin: found?.startYear,
      yearMax: found?.endYear,
      type: type || undefined,
      sort,
    })
  }, [debounced, era, type, sort, page])

  const { data, loading } = useApiFetch(fetcher, [debounced, era, type, sort, page])
  const items = data?.data ?? []
  const meta = data?.meta

  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <main className="catalog">
      <header className="catalog-head">
        <div className="catalog-eyebrow">Archivo</div>
        <h1 className="catalog-title">Catálogo de batallas</h1>
      </header>

      <div className="catalog-toolbar">
        <div className="input-with-icon" style={{ flex: '1 1 260px', maxWidth: 320 }}>
          <Icon name="search" size={16} />
          <input
            className="input"
            type="text"
            placeholder="Buscar batalla"
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
          />
        </div>
        <select
          className="select"
          value={era}
          onChange={(e) => reset(() => setEra(e.target.value))}
        >
          <option value="">Todas las épocas</option>
          {eras.map((era) => (
            <option key={era.key} value={era.key}>
              {era.label}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={type}
          onChange={(e) => reset(() => setType(e.target.value as '' | BattleType))}
        >
          <option value="">Todos los tipos</option>
          <option value="BATTLE">Batalla</option>
          <option value="SIEGE">Asedio</option>
          <option value="CAMPAIGN">Campaña</option>
        </select>
        <select
          className="select"
          value={sort}
          onChange={(e) => reset(() => setSort(e.target.value as BattleSort))}
        >
          <option value="importance">Más relevantes</option>
          <option value="year">Cronológico</option>
          <option value="name">Alfabético</option>
        </select>
      </div>

      {loading ? (
        <div className="catalog-rows">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 132 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="catalog-empty">Sin registros para esta consulta.</div>
      ) : (
        <>
          <div className="catalog-rows">
            {items.map((b) => (
              <BattleRow key={b.id} battle={b} />
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
