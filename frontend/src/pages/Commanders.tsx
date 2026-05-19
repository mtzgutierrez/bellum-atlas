import { useCallback, useState } from 'react'
import CommanderCard from '../components/CommanderCard'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import { useApiFetch } from '../hooks/useApiFetch'
import { useDebounce } from '../hooks/useDebounce'
import {
  commanderService,
  type CommanderSortBy,
} from '../services/commander.service'

type Mode = 'name' | 'country'

export default function Commanders() {
  const [mode, setMode] = useState<Mode>('name')
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<CommanderSortBy>('name')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(q, 300)

  const fetcher = useCallback(() => {
    const text = debounced.trim()
    const opts = { page, pageSize: 50, sortBy }
    if (text.length < 2) return commanderService.listar(opts)
    return mode === 'name'
      ? commanderService.buscarPorNombre(text, opts)
      : commanderService.buscarPorPais(text, opts)
  }, [mode, debounced, sortBy, page])

  const { data, loading } = useApiFetch(fetcher, [mode, debounced, sortBy, page])
  const items = data?.data ?? []
  const meta = data?.meta

  return (
    <main className="catalog">
      <header className="catalog-head">
        <div className="catalog-eyebrow">Archivo</div>
        <h1 className="catalog-title">Comandantes</h1>
      </header>

      <div className="catalog-toolbar">
        <div className="input-with-icon" style={{ flex: '1 1 280px', maxWidth: 340 }}>
          <Icon name="search" size={16} />
          <input
            className="input"
            type="text"
            placeholder={mode === 'name' ? 'Buscar comandante' : 'Buscar país'}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className="select"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as Mode)
            setQ('')
            setPage(1)
          }}
        >
          <option value="name">Buscar por nombre</option>
          <option value="country">Buscar por país</option>
        </select>
        <select
          className="select"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as CommanderSortBy)
            setPage(1)
          }}
        >
          <option value="name">Orden alfabético</option>
          <option value="birth">Orden cronológico</option>
        </select>
      </div>

      {loading ? (
        <div className="commanders-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="catalog-empty">Sin registros para esta consulta.</div>
      ) : (
        <>
          <div className="commanders-grid">
            {items.map((c) => (
              <CommanderCard key={c.id} commander={c} />
            ))}
          </div>
          {meta && meta.totalPages > 1 && <Pagination meta={meta} onPage={setPage} />}
        </>
      )}
    </main>
  )
}
