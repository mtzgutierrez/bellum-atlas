import { useState } from 'react'
import { TopBarDesktop } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import MapBackdrop from '../components/MapBackdrop'
import MapPin from '../components/MapPin'
import MapCluster from '../components/MapCluster'
import { battles, eras } from '../data/mock'
import type { Battle } from '../data/mock'

const pinPositions: Record<string, { x: number; y: number }> = {
  waterloo:      { x: 38, y: 28 },
  stalingrado:   { x: 65, y: 32 },
  lepanto:       { x: 46, y: 48 },
  agincourt:     { x: 36, y: 30 },
  gaugamela:     { x: 70, y: 42 },
  midway:        { x: 10, y: 42 },
  cannae:        { x: 48, y: 44 },
  trafalgar:     { x: 30, y: 46 },
  bretana:       { x: 34, y: 24 },
  constantinopla:{ x: 54, y: 40 },
  somme:         { x: 36, y: 28 },
  austerlitz:    { x: 49, y: 30 },
  normandia:     { x: 35, y: 27 },
  salamina:      { x: 53, y: 47 },
  gettysburg:    { x: 22, y: 35 },
  tours:         { x: 37, y: 36 },
  tsushima:      { x: 82, y: 38 },
  verdun:        { x: 40, y: 29 },
}

// Battles by era key
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
        <MapBackdrop>
          <MapCluster x={20} y={35} count={12} />
          <MapCluster x={72} y={55} count={8} />
          {visible.map(b => {
            const pos = pinPositions[b.id]
            if (!pos) return null
            return (
              <div key={b.id} onClick={() => setSelected(b === selected ? null : b)} style={{ cursor: 'pointer' }}>
                <MapPin x={pos.x} y={pos.y} size="md" />
              </div>
            )
          })}
        </MapBackdrop>

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

        {/* Selected battle popup */}
        {selected && pinPositions[selected.id] && (
          <div style={{
            position: 'absolute',
            left: `${pinPositions[selected.id].x}%`,
            top: `${pinPositions[selected.id].y - 8}%`,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'rgba(13,13,13,0.96)', border: '1px solid var(--color-border)',
            padding: '14px 16px', minWidth: 220, backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }}>
            <div className="ax-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {selected.era} · {selected.type === 'land' ? 'Terrestre' : selected.type === 'naval' ? 'Naval' : selected.type === 'air' ? 'Aéreo' : 'Asedio'}
            </div>
            <div className="ax-display" style={{ fontSize: 15, marginTop: 8 }}>{selected.name}</div>
            <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 4 }}>{selected.dateLabel}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{selected.place}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 8 }}>
              <span className="ax-label" style={{ fontSize: 9 }}>Fuerzas</span>
              <span className="ax-mono" style={{ fontSize: 11 }}>{selected.forces}</span>
            </div>
            <div style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              width: 12, height: 6,
              background: 'rgba(13,13,13,0.96)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }} />
          </div>
        )}

        {selected && (
          <div style={{ position: 'absolute', inset: 0, zIndex: -1 }} onClick={() => setSelected(null)} />
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
        <MapBackdrop>
          {visible.map(b => {
            const pos = pinPositions[b.id]
            if (!pos) return null
            return (
              <div key={b.id} onClick={() => setSelected(b === selected ? null : b)} style={{ cursor: 'pointer' }}>
                <MapPin x={pos.x} y={pos.y} size="sm" />
              </div>
            )
          })}
        </MapBackdrop>

        {/* Era filter chips */}
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          display: 'flex', gap: 6, overflowX: 'auto',
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
                <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 2 }}>{selected.dateLabel} · {selected.place}</div>
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
  const isMobile = window.innerWidth < 768
  return isMobile ? <MapExplorerMobile /> : <MapExplorerDesktop />
}
