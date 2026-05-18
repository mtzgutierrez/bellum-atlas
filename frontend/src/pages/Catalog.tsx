import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { useApiFetch } from '../hooks/useApiFetch'
import { fetchBattles } from '../api/client'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { eras } from '../data/mock'
import styles from './Catalog.module.css'

const typeOptions = [
  { icon: 'sword',  label: 'Terrestre', value: 'LAND'  },
  { icon: 'anchor', label: 'Naval',     value: 'NAVAL' },
  { icon: 'plane',  label: 'Aéreo',     value: 'AIR'   },
  { icon: 'castle', label: 'Asedio',    value: 'SIEGE' },
]

function Checkbox({ active }: { active: boolean }) {
  return <span className={`${styles.checkbox} ${active ? styles.checkboxActive : ''}`} />
}

function Sidebar({
  selectedEra, onSelectEra,
  selectedType, onSelectType,
}: {
  selectedEra: string; onSelectEra: (k: string) => void
  selectedType: string; onSelectType: (t: string) => void
}) {
  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={`ax-label ${styles.filterLabel}`}>Era</div>
        {eras.map(e => (
          <label key={e.key} onClick={() => onSelectEra(e.key === selectedEra ? '' : e.key)} className={styles.filterRow}>
            <Checkbox active={selectedEra === e.key} />
            <span style={{ flex: 1 }}>{e.label}</span>
          </label>
        ))}
      </div>
      <div className="ax-divider" />
      <div>
        <div className={`ax-label ${styles.filterLabel}`}>Tipo</div>
        {typeOptions.map(t => (
          <label key={t.value} onClick={() => onSelectType(t.value === selectedType ? '' : t.value)} className={styles.filterRow}>
            <Checkbox active={selectedType === t.value} />
            <Icon name={t.icon} size={12} color="var(--color-text-secondary)" />
            <span style={{ flex: 1 }}>{t.label}</span>
          </label>
        ))}
      </div>
    </aside>
  )
}

export function CatalogDesktop() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [selectedEra, setSelectedEra] = useState(searchParams.get('era') ?? '')
  const [selectedType, setSelectedType] = useState('')
  const [page, setPage] = useState(1)

  const fetcher = useCallback(
    () => fetchBattles({ q: query || undefined, era: selectedEra || undefined, type: selectedType || undefined, page, limit: 20 }),
    [query, selectedEra, selectedType, page],
  )
  const { data, loading, error } = useApiFetch(fetcher, [query, selectedEra, selectedType, page])

  const battles = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div className={styles.pageBody}>
        <div className={styles.header}>
          <div className={`ax-stamp ${styles.headerStamp}`}>Catálogo · Búsqueda full-text</div>
          <h1 className={`ax-display ${styles.headerTitle}`}>Batallas</h1>
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <Icon name="search" size={14} color="var(--color-text-muted)" />
              <input
                className="ax-input"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1) }}
                placeholder="Buscar por nombre, lugar, comandante o guerra…"
              />
              {meta && (
                <span className={`ax-mono ${styles.searchCount}`}>{meta.total} RESULTADOS</span>
              )}
            </div>
            <button className="ax-btn"><Icon name="sliders" size={14} /> Ordenar: Fecha ↓</button>
          </div>
        </div>

        <div className={styles.layout}>
          <Sidebar
            selectedEra={selectedEra}   onSelectEra={k => { setSelectedEra(k); setPage(1) }}
            selectedType={selectedType} onSelectType={t => { setSelectedType(t); setPage(1) }}
          />
          <div className={styles.results}>
            {loading && <div className={styles.empty}><div className={`ax-mono ${styles.emptyHint}`}>Cargando…</div></div>}
            {error && <div className={styles.empty}><div className={styles.emptyHint}>{error}</div></div>}
            {!loading && !error && (
              <>
                <div className={styles.resultList}>
                  {battles.map(b => <BattleCard key={b.id} battle={b} />)}
                </div>
                {battles.length === 0 && (
                  <div className={styles.empty}>
                    <div className={`ax-display ${styles.emptyTitle}`}>Sin resultados</div>
                    <div className={styles.emptyHint}>Prueba con otros términos o elimina algunos filtros.</div>
                  </div>
                )}
                {meta && meta.totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 8, padding: '24px 0', alignItems: 'center' }}>
                    <button className="ax-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                    <span className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {page} / {meta.totalPages}
                    </span>
                    <button className="ax-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CatalogMobile() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const fetcher = useCallback(
    () => fetchBattles({ q: query || undefined, page, limit: 20 }),
    [query, page],
  )
  const { data, loading } = useApiFetch(fetcher, [query, page])
  const battles = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="ax-page">
      <TopBarMobile />
      <div className={styles.mobilePageBody}>
        <div className={styles.mobileHeader}>
          <h1 className={`ax-display ${styles.mobileTitle}`}>Batallas</h1>
          <div className={styles.mobileSearchRow}>
            <div className={styles.mobileSearchBox}>
              <Icon name="search" size={13} color="var(--color-text-muted)" />
              <input
                className="ax-input"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1) }}
                placeholder="Buscar…"
                style={{ fontSize: 12 }}
              />
            </div>
            <button className="ax-btn" style={{ padding: '10px 12px' }}>
              <Icon name="sliders" size={14} />
            </button>
          </div>
          {meta && <div className={`ax-mono ${styles.mobileCount}`}>{meta.total} RESULTADOS</div>}
        </div>
        <div className={styles.mobileResults}>
          {loading
            ? <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 12 }}>Cargando…</div>
            : battles.map(b => <BattleCard key={b.id} battle={b} />)
          }
        </div>
        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '16px', justifyContent: 'center' }}>
            <button className="ax-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
              {page}/{meta.totalPages}
            </span>
            <button className="ax-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

export default function Catalog() {
  const isMobile = useIsMobile()
  return isMobile ? <CatalogMobile /> : <CatalogDesktop />
}
