import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { battles, eras } from '../data/mock'
import type { BattleType } from '../data/mock'

const typeOptions: { icon: string; label: string; value: BattleType; count: number }[] = [
  { icon: 'sword', label: 'Terrestre', value: 'land', count: 3812 },
  { icon: 'anchor', label: 'Naval', value: 'naval', count: 821 },
  { icon: 'plane', label: 'Aéreo', value: 'air', count: 142 },
  { icon: 'castle', label: 'Asedio', value: 'siege', count: 472 },
]

const eraCounts = [218, 642, 1108, 3279]

function Sidebar({
  selectedEras, onToggleEra,
  selectedTypes, onToggleType,
}: {
  selectedEras: string[]; onToggleEra: (k: string) => void
  selectedTypes: BattleType[]; onToggleType: (t: BattleType) => void
}) {
  const checkBox = (active: boolean) => (
    <span style={{ width: 12, height: 12, border: '1px solid var(--color-border)', background: active ? 'var(--color-crimson-bright)' : 'transparent', flexShrink: 0 }} />
  )
  return (
    <aside style={{ borderRight: '1px solid var(--color-border)', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div className="ax-label" style={{ marginBottom: 10 }}>Era</div>
        {eras.map((e, i) => (
          <label key={e.key} onClick={() => onToggleEra(e.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, cursor: 'pointer' }}>
            {checkBox(selectedEras.includes(e.key))}
            <span style={{ flex: 1 }}>{e.label}</span>
            <span className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>{eraCounts[i]}</span>
          </label>
        ))}
      </div>
      <div className="ax-divider" />
      <div>
        <div className="ax-label" style={{ marginBottom: 10 }}>Tipo</div>
        {typeOptions.map(t => (
          <label key={t.value} onClick={() => onToggleType(t.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, cursor: 'pointer' }}>
            {checkBox(selectedTypes.includes(t.value))}
            <Icon name={t.icon} size={12} color="var(--color-text-secondary)" />
            <span style={{ flex: 1 }}>{t.label}</span>
            <span className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>{t.count}</span>
          </label>
        ))}
      </div>
    </aside>
  )
}

// era keys from URL (?era=ancient) → battle era field values
const eraKeyToBattleEras: Record<string, string[]> = {
  ancient:      ['Antigüedad'],
  medieval:     ['Medieval', 'XV'],
  modern:       ['XVI', 'XVII', 'XVIII'],
  contemporary: ['XIX', 'XX', 'XXI'],
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
    const matchesQuery = !q || b.name.toLowerCase().includes(q) || b.war.toLowerCase().includes(q) || b.place.toLowerCase().includes(q)
    const matchesEra = selectedBattleEras.length === 0 || selectedBattleEras.includes(b.era)
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(b.type)
    return matchesQuery && matchesEra && matchesType
  })

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '32px 40px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="ax-stamp" style={{ marginBottom: 8 }}>Catálogo · Búsqueda full-text</div>
          <h1 className="ax-display" style={{ fontSize: 36, margin: 0, letterSpacing: '0.04em' }}>Batallas</h1>
          <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, border: '1px solid var(--color-border)', padding: '11px 14px', background: 'var(--color-surface)' }}>
              <Icon name="search" size={14} color="var(--color-text-muted)" />
              <input
                className="ax-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nombre, lugar, comandante o guerra…"
              />
              <span className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>{filtered.length} RESULTADOS</span>
            </div>
            <button className="ax-btn"><Icon name="sliders" size={14} /> Ordenar: Fecha ↓</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1 }}>
          <Sidebar
            selectedEras={selectedEras} onToggleEra={k => toggle(selectedEras, k, setSelectedEras)}
            selectedTypes={selectedTypes} onToggleType={t => toggle(selectedTypes, t, setSelectedTypes)}
          />
          <div style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(b => <BattleCard key={b.id} battle={b} />)}
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div className="ax-display" style={{ fontSize: 18 }}>Sin resultados</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Prueba con otros términos o elimina algunos filtros.</div>
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
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="ax-display" style={{ fontSize: 22, margin: 0, letterSpacing: '0.04em' }}>Batallas</h1>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: '1px solid var(--color-border)', padding: '10px 12px', background: 'var(--color-surface)' }}>
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
          <div className="ax-mono" style={{ marginTop: 10, fontSize: 10.5, color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}>
            {filtered.length} RESULTADOS
          </div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
