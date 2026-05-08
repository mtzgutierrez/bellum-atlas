import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { battles, eras } from '../data/mock'
import type { BattleType } from '../data/mock'
import styles from './Catalog.module.css'

const typeOptions: { icon: string; label: string; value: BattleType; count: number }[] = [
  { icon: 'sword',  label: 'Terrestre', value: 'land',  count: 3812 },
  { icon: 'anchor', label: 'Naval',     value: 'naval', count: 821  },
  { icon: 'plane',  label: 'Aéreo',     value: 'air',   count: 142  },
  { icon: 'castle', label: 'Asedio',    value: 'siege', count: 472  },
]

const eraCounts = [218, 642, 1108, 3279]

// era keys from URL (?era=ancient) → battle era field values
const eraKeyToBattleEras: Record<string, string[]> = {
  ancient:      ['Antigüedad'],
  medieval:     ['Medieval', 'XV'],
  modern:       ['XVI', 'XVII', 'XVIII'],
  contemporary: ['XIX', 'XX', 'XXI'],
}

function Checkbox({ active }: { active: boolean }) {
  return (
    <span className={`${styles.checkbox} ${active ? styles.checkboxActive : ''}`} />
  )
}

function Sidebar({
  selectedEras, onToggleEra,
  selectedTypes, onToggleType,
}: {
  selectedEras: string[]; onToggleEra: (k: string) => void
  selectedTypes: BattleType[]; onToggleType: (t: BattleType) => void
}) {
  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={`ax-label ${styles.filterLabel}`}>Era</div>
        {eras.map((e, i) => (
          <label key={e.key} onClick={() => onToggleEra(e.key)} className={styles.filterRow}>
            <Checkbox active={selectedEras.includes(e.key)} />
            <span style={{ flex: 1 }}>{e.label}</span>
            <span className={`ax-mono ${styles.filterCount}`}>{eraCounts[i]}</span>
          </label>
        ))}
      </div>
      <div className="ax-divider" />
      <div>
        <div className={`ax-label ${styles.filterLabel}`}>Tipo</div>
        {typeOptions.map(t => (
          <label key={t.value} onClick={() => onToggleType(t.value)} className={styles.filterRow}>
            <Checkbox active={selectedTypes.includes(t.value)} />
            <Icon name={t.icon} size={12} color="var(--color-text-secondary)" />
            <span style={{ flex: 1 }}>{t.label}</span>
            <span className={`ax-mono ${styles.filterCount}`}>{t.count}</span>
          </label>
        ))}
      </div>
    </aside>
  )
}

export function CatalogDesktop() {
  const [searchParams] = useSearchParams()
  const initialEra = searchParams.get('era') ?? ''

  const [query, setQuery] = useState('')
  const [selectedEras, setSelectedEras] = useState<string[]>(initialEra ? [initialEra] : [])
  const [selectedTypes, setSelectedTypes] = useState<BattleType[]>([])

  const toggle = <T extends string>(arr: T[], val: T, set: (a: T[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const selectedBattleEras = selectedEras.flatMap(k => eraKeyToBattleEras[k] ?? [])

  const filtered = battles.filter(b => {
    const q = query.toLowerCase()
    const matchesQuery   = !q || b.name.toLowerCase().includes(q) || b.war.toLowerCase().includes(q) || b.place.toLowerCase().includes(q)
    const matchesEra     = selectedBattleEras.length === 0 || selectedBattleEras.includes(b.era)
    const matchesType    = selectedTypes.length === 0 || selectedTypes.includes(b.type)
    return matchesQuery && matchesEra && matchesType
  })

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
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nombre, lugar, comandante o guerra…"
              />
              <span className={`ax-mono ${styles.searchCount}`}>{filtered.length} RESULTADOS</span>
            </div>
            <button className="ax-btn"><Icon name="sliders" size={14} /> Ordenar: Fecha ↓</button>
          </div>
        </div>

        <div className={styles.layout}>
          <Sidebar
            selectedEras={selectedEras}   onToggleEra={k => toggle(selectedEras, k, setSelectedEras)}
            selectedTypes={selectedTypes} onToggleType={t => toggle(selectedTypes, t, setSelectedTypes)}
          />
          <div className={styles.results}>
            <div className={styles.resultList}>
              {filtered.map(b => <BattleCard key={b.id} battle={b} />)}
            </div>
            {filtered.length === 0 && (
              <div className={styles.empty}>
                <div className={`ax-display ${styles.emptyTitle}`}>Sin resultados</div>
                <div className={styles.emptyHint}>Prueba con otros términos o elimina algunos filtros.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CatalogMobile() {
  const [query, setQuery] = useState('')

  const filtered = battles.filter(b => {
    const q = query.toLowerCase()
    return !q || b.name.toLowerCase().includes(q) || b.war.toLowerCase().includes(q)
  })

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
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar…"
                style={{ fontSize: 12 }}
              />
            </div>
            <button className="ax-btn" style={{ padding: '10px 12px' }}>
              <Icon name="sliders" size={14} />
            </button>
          </div>
          <div className={`ax-mono ${styles.mobileCount}`}>{filtered.length} RESULTADOS</div>
        </div>
        <div className={styles.mobileResults}>
          {filtered.map(b => <BattleCard key={b.id} battle={b} />)}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Catalog() {
  const isMobile = useIsMobile()
  return isMobile ? <CatalogMobile /> : <CatalogDesktop />
}
