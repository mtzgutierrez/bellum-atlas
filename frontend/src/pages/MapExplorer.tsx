import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import SmartImage, { TYPE_LABEL } from '../components/SmartImage'
import TypeIcon from '../components/TypeIcon'
import { useApiFetch } from '../hooks/useApiFetch'
import { useDebounce } from '../hooks/useDebounce'
import { battleService } from '../services/battle.service'
import type { BattlePoint } from '../services/battle.types'
import { formatYear } from '../utils/dates'

const YEAR_MIN = -3000
const YEAR_MAX = new Date().getFullYear()
// Lapso máximo de la ventana temporal. Igual que el límite del backend: evita
// pedir miles de batallas de golpe. La ventana por defecto son los últimos
// 150 años.
const MAX_SPAN = 150
const DEFAULT_MAX = YEAR_MAX
const DEFAULT_MIN = YEAR_MAX - MAX_SPAN

export default function MapExplorer() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const focusSlug = searchParams.get('focus')
  const [q, setQ] = useState('')
  const [yearMin, setYearMin] = useState(DEFAULT_MIN)
  const [yearMax, setYearMax] = useState(DEFAULT_MAX)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const debouncedQ = useDebounce(q, 300)

  // Carga de puntos ligeros del mapa (capado a 10k en backend). Siempre se
  // envía la ventana de años (lapso ≤ 150) para no traer todo el catálogo.
  const fetcher = useCallback(() => {
    const text = debouncedQ.trim()
    return battleService.puntos({
      search: text.length >= 2 ? text : undefined,
      yearMin,
      yearMax,
    })
  }, [debouncedQ, yearMin, yearMax])

  const { data, loading } = useApiFetch(fetcher, [debouncedQ, yearMin, yearMax])
  const items = useMemo(() => data ?? [], [data])

  // ── Foco desde URL (?focus=<slug>) ─────────────────────────────────────
  const focusFetcher = useCallback(
    () => (focusSlug ? battleService.detalle(focusSlug) : Promise.resolve(null)),
    [focusSlug],
  )
  const { data: focusBattle } = useApiFetch(focusFetcher, [focusSlug])

  // ── Leaflet setup ──────────────────────────────────────────────────────
  const mapRef = useRef<L.Map | null>(null)
  const mapEl = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const focusLayerRef = useRef<L.LayerGroup | null>(null)
  const markersById = useRef<Map<string, L.Marker>>(new Map())
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    const map = L.map(mapEl.current, {
      worldCopyJump: true,
      zoomControl: true,
      preferCanvas: true,
      attributionControl: false,
    }).setView([30, 10], 2)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
      pane: 'shadowPane',
    }).addTo(map)

    L.control
      .attribution({ prefix: false, position: 'bottomright' })
      .addAttribution(
        '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/attributions">CARTO</a>',
      )
      .addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    focusLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    setMapReady(true)
  }, [])

  // Pinta pines cuando cambian los items o la selección.
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    markersById.current.clear()

    for (const b of items) {
      const icon = L.divIcon({
        html: `<div class="battle-pin ${selectedId === b.id ? 'selected' : ''}"></div>`,
        className: 'battle-pin-wrap',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
      const marker = L.marker([b.latitude, b.longitude], { icon })
        .bindPopup(buildPopup(b), {
          className: 'ares-popup',
          maxWidth: 260,
          minWidth: 200,
        })
        .on('click', () => setSelectedId(b.id))
        .on('popupopen', (e) => bindPopupNavigation(e.popup, b.slug, navigate))
      marker.addTo(layer)
      markersById.current.set(b.id, marker)
    }
  }, [items, selectedId, navigate])

  // Centra y abre popup del seleccionado.
  useEffect(() => {
    if (!selectedId) return
    const map = mapRef.current
    const marker = markersById.current.get(selectedId)
    if (!map || !marker) return
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 5), { duration: 0.6 })
    marker.openPopup()
  }, [selectedId])

  // Marker de "foco" cuando llegamos con ?focus=<slug>.
  useEffect(() => {
    const map = mapRef.current
    const layer = focusLayerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    if (!focusBattle || focusBattle.latitude == null || focusBattle.longitude == null) {
      return
    }
    const point: BattlePoint = {
      id: focusBattle.id,
      name: focusBattle.name,
      slug: focusBattle.slug,
      latitude: focusBattle.latitude,
      longitude: focusBattle.longitude,
      year: focusBattle.year,
      type: focusBattle.type,
      importanceScore: focusBattle.importanceScore,
    }
    const marker = L.marker([point.latitude, point.longitude], {
      icon: L.divIcon({
        html: '<div class="battle-pin selected"></div>',
        className: 'battle-pin-wrap',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      zIndexOffset: 1000,
    })
      .bindPopup(buildPopup(point), {
        className: 'ares-popup',
        maxWidth: 260,
        minWidth: 200,
      })
      .on('popupopen', (e) => bindPopupNavigation(e.popup, point.slug, navigate))
      .addTo(layer)
    setSelectedId(point.id)
    map.flyTo([point.latitude, point.longitude], 6, { duration: 0.6 })
    marker.openPopup()
  }, [focusBattle, mapReady, navigate])

  const clearFocus = () => {
    if (focusSlug) {
      const next = new URLSearchParams(searchParams)
      next.delete('focus')
      setSearchParams(next, { replace: true })
    }
  }

  const reset = () => {
    setQ('')
    setYearMin(DEFAULT_MIN)
    setYearMax(DEFAULT_MAX)
    clearFocus()
  }

  const hasFilters =
    q.length > 0 ||
    yearMin !== DEFAULT_MIN ||
    yearMax !== DEFAULT_MAX ||
    focusSlug != null

  return (
    <div className="map-page">
      <aside className="map-sidebar">
        <div className="map-filters">
          <div className="filter-group">
            <label className="filter-label">
              <span>Buscar por nombre</span>
              {q && (
                <button className="btn-link" onClick={() => setQ('')}>
                  Limpiar
                </button>
              )}
            </label>
            <div className="input-with-icon">
              <Icon name="search" size={16} />
              <input
                className="input"
                type="text"
                placeholder="Waterloo, Lepanto, Stalingrado…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span>Periodo</span>
              <span className="value">
                {formatYearLabel(yearMin)} — {formatYearLabel(yearMax)}
              </span>
            </label>
            <DualRange
              min={YEAR_MIN}
              max={YEAR_MAX}
              maxSpan={MAX_SPAN}
              valueMin={yearMin}
              valueMax={yearMax}
              onChange={(a, b) => {
                setYearMin(a)
                setYearMax(b)
              }}
            />
          </div>

          {hasFilters && (
            <button className="btn-link" onClick={reset} style={{ alignSelf: 'flex-start' }}>
              Restablecer filtros
            </button>
          )}
        </div>

        <div className="map-results">
          <div className="map-results-header">
            <span>Resultados</span>
            <span>
              {loading
                ? '…'
                : `${items.length.toLocaleString('es-ES')} registro${items.length === 1 ? '' : 's'}`}
            </span>
          </div>
          {!loading && items.length === 0 && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.1em',
              }}
            >
              Sin registros para esta consulta.
            </div>
          )}
          {items.map((b) => (
            <div
              key={b.id}
              className={`map-result-item ${selectedId === b.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(b.id)}
              onDoubleClick={() => navigate(`/battles/${b.slug}`)}
            >
              <div className="map-result-thumb">
                <SmartImage src={null} alt={b.name} type={b.type} />
              </div>
              <div className="map-result-body">
                <h4 className="map-result-name">{b.name}</h4>
                <div className="map-result-meta">
                  <span>{formatYear(b.year)}</span>
                  <span className="dot">·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <TypeIcon type={b.type} size={10} /> {TYPE_LABEL[b.type] ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="map-canvas">
        <div id="leaflet-map" ref={mapEl} />
        <div className="map-legend" aria-hidden="true">
          <div className="item">
            <span className="swatch crimson" /> Batalla registrada
          </div>
          <div className="item" style={{ color: 'var(--color-text-muted)' }}>
            Doble clic en un resultado: abre ficha
          </div>
        </div>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function buildPopup(b: BattlePoint): string {
  const escape = (s: string | null) =>
    (s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
    )
  const year = formatYear(b.year)
  const type = TYPE_LABEL[b.type] ?? '—'
  return `
    <div class="popup-content">
      <div class="name">${escape(b.name)}</div>
      <div class="meta">
        <div>${escape(year)}</div>
        <div>${escape(type)}</div>
      </div>
      <a class="open-link" data-battle-slug="${escape(b.slug)}" href="/battles/${escape(b.slug)}">Abrir ficha →</a>
    </div>`
}

function bindPopupNavigation(
  popup: L.Popup,
  slug: string,
  navigate: (path: string) => void,
): void {
  const el = popup.getElement()
  if (!el) return
  const link = el.querySelector<HTMLAnchorElement>('a.open-link')
  if (!link) return
  link.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    navigate(`/battles/${slug}`)
  })
}

function formatYearLabel(y: number): string {
  if (y === 0) return '0'
  if (y < 0) return `${Math.abs(y)} AC`
  return String(y)
}

// ── DualRange ──────────────────────────────────────────────────────────────

function DualRange({
  min,
  max,
  maxSpan,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number
  max: number
  maxSpan?: number
  valueMin: number
  valueMax: number
  onChange: (a: number, b: number) => void
}) {
  const fill = {
    left: `${((valueMin - min) / (max - min)) * 100}%`,
    right: `${100 - ((valueMax - min) / (max - min)) * 100}%`,
  }
  // Con maxSpan, en vez de impedir el movimiento se desliza el otro extremo,
  // manteniendo la ventana de como mucho `maxSpan` años.
  const update = (which: 'a' | 'b', raw: string) => {
    const v = Number.parseInt(raw, 10)
    if (Number.isNaN(v)) return
    if (which === 'a') {
      const a = Math.min(v, valueMax - 1)
      const b =
        maxSpan != null && valueMax - a > maxSpan
          ? Math.min(max, a + maxSpan)
          : valueMax
      onChange(a, b)
    } else {
      const b = Math.max(v, valueMin + 1)
      const a =
        maxSpan != null && b - valueMin > maxSpan
          ? Math.max(min, b - maxSpan)
          : valueMin
      onChange(a, b)
    }
  }
  return (
    <div>
      <div className="dual-range">
        <div className="track">
          <div className="fill" style={fill} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => update('a', e.target.value)}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => update('b', e.target.value)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
        <input
          className="input"
          type="number"
          value={valueMin}
          onChange={(e) => update('a', e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 8px' }}
        />
        <input
          className="input"
          type="number"
          value={valueMax}
          onChange={(e) => update('b', e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 8px' }}
        />
      </div>
    </div>
  )
}
