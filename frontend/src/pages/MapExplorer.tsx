/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react'
// @ts-expect-error
import { feature } from 'topojson-client'
import { TopBarDesktop } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import { battles, eras } from '../data/mock'
import type { Battle } from '../data/mock'
import { useIsMobile } from '../hooks/useIsMobile'
import styles from './MapExplorer.module.css'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const W = 960
const H = 480

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

function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * W
  const r = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(Math.PI / 4 + r / 2)) / Math.PI) / 2) * H
  return [x, y]
}

function geomToPath(geom: any): string {
  const ring = (coords: number[][]): string =>
    coords
      .map((c, i) => {
        const [x, y] = project(c[0], c[1])
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join('') + 'Z'

  if (geom.type === 'Polygon')      return (geom.coordinates as number[][][]).map(ring).join('')
  if (geom.type === 'MultiPolygon') return (geom.coordinates as number[][][][]).flatMap(p => p.map(ring)).join('')
  return ''
}

type VB = { x: number; y: number; w: number; h: number }

const INITIAL_VB: VB = { x: 0, y: 20, w: W, h: H - 40 }

function WorldMap({
  visible,
  selected,
  onSelect,
}: {
  visible: Battle[]
  selected: Battle | null
  onSelect: (b: Battle | null) => void
}) {
  const svgRef   = useRef<SVGSVGElement>(null)
  const [paths, setPaths]       = useState<string[]>([])
  const [vb, setVb]             = useState<VB>(INITIAL_VB)
  const vbRef    = useRef(vb)
  const dragRef  = useRef<{ startX: number; startY: number; vb: VB } | null>(null)
  const touchRef = useRef<{ startX: number; startY: number; vb: VB } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => { vbRef.current = vb }, [vb])

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(topo => {
        const fc = feature(topo, topo.objects.countries) as any
        setPaths((fc.features as any[]).map((f: any) => geomToPath(f.geometry)))
      })
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const v    = vbRef.current
      const rect = el.getBoundingClientRect()
      const mx   = v.x + ((e.clientX - rect.left) / rect.width) * v.w
      const my   = v.y + ((e.clientY - rect.top)  / rect.height) * v.h
      const factor = e.deltaY > 0 ? 1.2 : 1 / 1.2
      const nw   = Math.min(W * 4, Math.max(W / 8, v.w * factor))
      const nh   = nw * (v.h / v.w)
      setVb({ x: mx - (mx - v.x) * (nw / v.w), y: my - (my - v.y) * (nh / v.h), w: nw, h: nh })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, vb: vbRef.current }
    setIsDragging(true)
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    const d    = dragRef.current
    const rect = svgRef.current!.getBoundingClientRect()
    const dx   = ((e.clientX - d.startX) / rect.width)  * d.vb.w
    const dy   = ((e.clientY - d.startY) / rect.height) * d.vb.h
    setVb({ ...d.vb, x: d.vb.x - dx, y: d.vb.y - dy })
  }
  const onMouseUp = () => { dragRef.current = null; setIsDragging(false) }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1)
      touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, vb: vbRef.current }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current || e.touches.length !== 1) return
    const d    = touchRef.current
    const rect = svgRef.current!.getBoundingClientRect()
    const dx   = ((e.touches[0].clientX - d.startX) / rect.width)  * d.vb.w
    const dy   = ((e.touches[0].clientY - d.startY) / rect.height) * d.vb.h
    setVb({ ...d.vb, x: d.vb.x - dx, y: d.vb.y - dy })
  }
  const onTouchEnd = () => { touchRef.current = null }

  const zoom = W / vb.w

  return (
    <svg
      ref={svgRef}
      viewBox={`${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`}
      style={{
        width: '100%', height: '100%', background: '#06090a',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'block', userSelect: 'none', touchAction: 'none',
      }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}     onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="#0e1610" stroke="rgba(107,122,90,0.35)" strokeWidth={0.4 / zoom} />
      ))}
      {visible.map(b => {
        const [cx, cy] = project(b.lon, b.lat)
        const isSelected = selected?.id === b.id
        return (
          <g key={b.id} onClick={() => onSelect(isSelected ? null : b)} style={{ cursor: 'pointer' }}>
            {isSelected && <circle cx={cx} cy={cy} r={14 / zoom} fill="rgba(212,160,23,0.15)" />}
            <circle cx={cx} cy={cy} r={(isSelected ? 7 : 4) / zoom}
              fill={isSelected ? '#D4A017' : '#B8860B'}
              stroke="rgba(0,0,0,0.6)" strokeWidth={1 / zoom} />
          </g>
        )
      })}
    </svg>
  )
}

export function MapExplorerDesktop() {
  const [selected, setSelected] = useState<Battle | null>(null)
  const [eraFilter, setEraFilter] = useState<string>('all')

  const visible = battles.filter(b =>
    eraFilter === 'all' || (eraKeyToBattleEras[eraFilter] ?? []).includes(b.era)
  )

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div className={styles.mapWrapper}>
        <WorldMap visible={visible} selected={selected} onSelect={setSelected} />

        <div className={styles.eraBar}>
          {['all', ...eras.map(e => e.key)].map(k => (
            <button key={k} className={`ax-tag ${eraFilter === k ? 'active' : ''}`} onClick={() => setEraFilter(k)}>
              {eraLabels[k]}
            </button>
          ))}
        </div>

        <div className={styles.battleCount}>
          <div className={`ax-mono ${styles.battleCountLabel}`}>MOSTRANDO</div>
          <div className={`ax-display ${styles.battleCountValue}`}>{visible.length}</div>
          <div className={`ax-stat-label ${styles.battleCountSub}`}>de 5.247 batallas</div>
          {eraFilter !== 'all' && (
            <div className={`ax-mono ${styles.battleCountEra}`}>{eraLabels[eraFilter].toUpperCase()}</div>
          )}
        </div>

        <div className={styles.hint}>
          <div className={styles.hintList}>
            <span>Scroll · Zoom</span>
            <span>Arrastrar · Mover</span>
            <span>Click pin · Detalle</span>
          </div>
        </div>

        {selected && (
          <div className={styles.popup}>
            <button className={styles.popupClose} onClick={() => setSelected(null)}>
              <Icon name="x" size={12} />
            </button>
            <div className={`ax-mono ${styles.popupEra}`}>
              {selected.era} · {selected.type === 'land' ? 'Terrestre' : selected.type === 'naval' ? 'Naval' : selected.type === 'air' ? 'Aéreo' : 'Asedio'}
            </div>
            <div className={`ax-display ${styles.popupName}`}>{selected.name}</div>
            <div className={styles.popupWar}>{selected.war}</div>
            <div className={`ax-mono ${styles.popupDate}`}>{selected.dateLabel}</div>
            <div className={styles.popupPlace}>{selected.place}</div>
            <div className={styles.popupStats}>
              <div>
                <div className={`ax-label ${styles.popupStatLabel}`}>Fuerzas</div>
                <div className={`ax-mono ${styles.popupStatValue}`}>{selected.forces}</div>
              </div>
              <div>
                <div className={`ax-label ${styles.popupStatLabel}`}>Bajas est.</div>
                <div className={`ax-mono ${styles.popupStatValue}`}>{selected.casualties}</div>
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

  const visible = battles.filter(b =>
    eraFilter === 'all' || (eraKeyToBattleEras[eraFilter] ?? []).includes(b.era)
  )

  return (
    <div className="ax-page">
      <div className={styles.mapWrapper}>
        <WorldMap visible={visible} selected={selected} onSelect={setSelected} />

        <div className={styles.mobileEraBar}>
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

        <div className={styles.mobileBottom}>
          {selected ? (
            <div className={styles.mobileSelected}>
              <div>
                <div className={`ax-mono ${styles.mobileSelectedEra}`}>
                  {selected.era.toUpperCase()} · {selected.type.toUpperCase()}
                </div>
                <div className={`ax-display ${styles.mobileSelectedName}`}>{selected.name}</div>
                <div className={`ax-mono ${styles.mobileSelectedMeta}`}>
                  {selected.dateLabel} · {selected.place}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="ax-btn ax-btn-ghost" style={{ padding: 8 }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ) : (
            <div className={`ax-mono ${styles.mobileEmptyHint}`}>
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
