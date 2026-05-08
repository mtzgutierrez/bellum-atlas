import { useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { TopBarDesktop } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import { battles, eras } from '../data/mock'
import type { Battle } from '../data/mock'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const eraKeyToBattleEras: Record<string, string[]> = {
  ancient:      ['Antigüedad'],
  medieval:     ['Medieval', 'XV'],
  modern:       ['XVI', 'XVII', 'XVIII'],
  contemporary: ['XIX', 'XX', 'XXI'],
}

const eraLabels: Record<string, string> = {
  all:          'Todas las eras',
  ancient:      'Antigüedad',
  medieval:     'Edad Media',
  modern:       'Edad Moderna',
  contemporary: 'Edad Contemporánea',
}

function WorldMap({
  visible,
  selected,
  onSelect,
}: {
  visible: Battle[]
  selected: Battle | null
  onSelect: (b: Battle | null) => void
}) {
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ scale: 140, center: [10, 30] }}
      style={{ width: '100%', height: '100%', background: '#06090a' }}
    >
      <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={8}>
        {/* Countries */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: '#0e1610',
                    stroke: 'rgba(107,122,90,0.35)',
                    strokeWidth: 0.4,
                    outline: 'none',
                  },
                  hover: {
                    fill: '#141f16',
                    stroke: 'rgba(184,134,11,0.4)',
                    strokeWidth: 0.5,
                    outline: 'none',
                  },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Battle markers */}
        {visible.map(b => {
          const isSelected = selected?.id === b.id
          return (
            <Marker
              key={b.id}
              coordinates={[b.lon, b.lat]}
              onClick={() => onSelect(isSelected ? null : b)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r={isSelected ? 7 : 4}
                fill={isSelected ? '#D4A017' : '#B8860B'}
                stroke={isSelected ? 'rgba(212,160,23,0.5)' : 'rgba(0,0,0,0.6)'}
                strokeWidth={isSelected ? 6 : 1}
                style={{ transition: 'all 150ms ease' }}
              />
            </Marker>
          )
        })}
      </ZoomableGroup>
    </ComposableMap>
  )
}

export function MapExplorerDesktop() {
  const [selected, setSelected] = useState<Battle | null>(null)
  const [eraFilter, setEraFilter] = useState<string>('all')

  const visible = battles.filter(b => {
    if (eraFilter === 'all') return true
    return (eraKeyToBattleEras[eraFilter] ?? []).includes(b.era)
  })

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <WorldMap visible={visible} selected={selected} onSelect={setSelected} />

        {/* Era filter bar */}
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6,
          background: 'rgba(13,13,13,0.9)', border: '1px solid var(--color-border)',
          padding: '10px 14px', backdropFilter: 'blur(8px)',
        }}>
          {['all', ...eras.map(e => e.key)].map(k => (
            <button
              key={k}
              className={`ax-tag ${eraFilter === k ? 'active' : ''}`}
              onClick={() => setEraFilter(k)}
            >
              {eraLabels[k]}
            </button>
          ))}
        </div>

        {/* Battle count */}
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(13,13,13,0.88)', border: '1px solid var(--color-border)',
          padding: '14px 16px', backdropFilter: 'blur(8px)',
        }}>
          <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>MOSTRANDO</div>
          <div className="ax-display" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>{visible.length}</div>
          <div className="ax-stat-label" style={{ marginTop: 6 }}>de 5.247 batallas</div>
          {eraFilter !== 'all' && (
            <div className="ax-mono" style={{ fontSize: 10, color: 'var(--color-gold-bright)', marginTop: 8, letterSpacing: '0.08em' }}>
              {eraLabels[eraFilter].toUpperCase()}
            </div>
          )}
        </div>

        {/* Zoom hint */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(13,13,13,0.88)', border: '1px solid var(--color-border)',
          padding: '10px 14px', backdropFilter: 'blur(8px)',
        }}>
          <div className="ax-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Scroll · Zoom</span>
            <span>Arrastrar · Mover</span>
            <span>Click pin · Detalle</span>
          </div>
        </div>

        {/* Selected battle popup */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            background: 'rgba(13,13,13,0.96)', border: '1px solid var(--color-gold)',
            padding: '16px 18px', minWidth: 260, backdropFilter: 'blur(8px)',
          }}>
            <button
              onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
            >
              <Icon name="x" size={12} />
            </button>
            <div className="ax-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {selected.era} · {selected.type === 'land' ? 'Terrestre' : selected.type === 'naval' ? 'Naval' : selected.type === 'air' ? 'Aéreo' : 'Asedio'}
            </div>
            <div className="ax-display" style={{ fontSize: 18, marginTop: 8, letterSpacing: '0.04em' }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{selected.war}</div>
            <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 6 }}>{selected.dateLabel}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{selected.place}</div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="ax-label" style={{ fontSize: 9 }}>Fuerzas</div>
                <div className="ax-mono" style={{ fontSize: 12, marginTop: 2 }}>{selected.forces}</div>
              </div>
              <div>
                <div className="ax-label" style={{ fontSize: 9 }}>Bajas est.</div>
                <div className="ax-mono" style={{ fontSize: 12, marginTop: 2 }}>{selected.casualties}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MapExplorerMobile() {
  const [selected, setSelected] = useState<Battle | null>(null)
  const [eraFilter, setEraFilter] = useState<string>('all')

  const visible = battles.filter(b => {
    if (eraFilter === 'all') return true
    return (eraKeyToBattleEras[eraFilter] ?? []).includes(b.era)
  })

  return (
    <div className="ax-page">
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <WorldMap visible={visible} selected={selected} onSelect={setSelected} />

        {/* Era filter chips */}
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          display: 'flex', gap: 6, overflowX: 'auto',
          background: 'rgba(13,13,13,0.8)', padding: '8px 10px',
          backdropFilter: 'blur(8px)',
        }}>
          {['all', ...eras.map(e => e.key)].map(k => (
            <button
              key={k}
              className={`ax-tag ${eraFilter === k ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', fontSize: 10 }}
              onClick={() => setEraFilter(k)}
            >
              {k === 'all' ? 'Todas' : eras.find(e => e.key === k)?.label}
            </button>
          ))}
        </div>

        {/* Bottom panel */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(13,13,13,0.92)', borderTop: '1px solid var(--color-border)',
          padding: '12px 16px', backdropFilter: 'blur(10px)',
        }}>
          {selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="ax-mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}>
                  {selected.era.toUpperCase()} · {selected.type.toUpperCase()}
                </div>
                <div className="ax-display" style={{ fontSize: 16, marginTop: 2 }}>{selected.name}</div>
                <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {selected.dateLabel} · {selected.place}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="ax-btn ax-btn-ghost" style={{ padding: 8 }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ) : (
            <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {visible.length} BATALLAS · Toca un pin para ver detalles
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function MapExplorer() {
  const isMobile = useIsMobile()
  return isMobile ? <MapExplorerMobile /> : <MapExplorerDesktop />
}
