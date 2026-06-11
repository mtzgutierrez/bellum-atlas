import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import SmartImage, { TYPE_LABEL } from '../components/SmartImage'
import TypeIcon from '../components/TypeIcon'
import { useApiFetch } from '../hooks/useApiFetch'
import { useDebounce } from '../hooks/useDebounce'
import { useIsMobile } from '../hooks/useIsMobile'
import { battleService } from '../services/battle.service'
import type { BattlePoint, BattleType } from '../services/battle.types'
import { formatBattleDates } from '../utils/dates'

const YEAR_MIN = -3000
const YEAR_MAX = new Date().getFullYear()
// Lapso máximo de la ventana temporal. Igual que el límite del backend: evita
// pedir miles de batallas de golpe. La ventana por defecto son los últimos
// 150 años.
const MAX_SPAN = 150
const DEFAULT_MAX = YEAR_MAX
const DEFAULT_MIN = YEAR_MAX - MAX_SPAN
// Umbral del filtro "solo las más relevantes" (importanceScore = nº sitelinks).
const RELEVANT_MIN = 40
// Radio de agrupación en píxeles de pantalla para el clustering propio.
const CLUSTER_CELL = 58
// Zoom mínimo para permitir "Buscar en esta zona": por debajo el área abarca
// demasiado territorio (y demasiadas batallas).
const MIN_AREA_ZOOM = 5

type Bounds = { n: number; s: number; e: number; w: number }

const TYPE_FILTERS: { value: BattleType; label: string }[] = [
  { value: 'BATTLE', label: 'Batallas' },
  { value: 'SIEGE', label: 'Asedios' },
  { value: 'CAMPAIGN', label: 'Campañas' },
]

export default function MapExplorer() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const focusSlug = searchParams.get('focus')
  const [q, setQ] = useState('')
  const [yearMin, setYearMin] = useState(DEFAULT_MIN)
  const [yearMax, setYearMax] = useState(DEFAULT_MAX)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [type, setType] = useState<BattleType | null>(null)
  const [onlyRelevant, setOnlyRelevant] = useState(false)
  // Modo "zona": filtra por el área del mapa (bbox) y todas las épocas.
  const [area, setArea] = useState<Bounds | null>(null)
  // Zoom actual: controla si se puede buscar por zona (evita áreas enormes).
  const [zoom, setZoom] = useState(2)
  // En móvil/tablet (<960px, igual que el breakpoint del layout) los filtros se
  // muestran como cajón superpuesto sobre el mapa, accesible con un botón
  // flotante. En escritorio viven siempre en la barra lateral.
  const isMobile = useIsMobile(960)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debouncedQ = useDebounce(q, 300)

  // Carga de puntos ligeros del mapa (capado a 10k en backend). En modo zona
  // se manda el bbox (sin límite temporal); si no, la ventana de años.
  const fetcher = useCallback(() => {
    const text = debouncedQ.trim()
    const base = {
      search: text.length >= 2 ? text : undefined,
      type: type ?? undefined,
      minImportance: onlyRelevant ? RELEVANT_MIN : undefined,
    }
    if (area) {
      return battleService.puntos({
        ...base,
        bboxN: area.n,
        bboxS: area.s,
        bboxE: area.e,
        bboxW: area.w,
      })
    }
    return battleService.puntos({ ...base, yearMin, yearMax })
  }, [debouncedQ, type, onlyRelevant, area, yearMin, yearMax])

  const { data, loading } = useApiFetch(fetcher, [
    debouncedQ,
    type,
    onlyRelevant,
    area,
    yearMin,
    yearMax,
  ])
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
  const reclusterRef = useRef<() => void>(() => {})
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
    // El clustering depende de la proyección actual: recalcular al mover/zoom.
    map.on('moveend zoomend', () => {
      reclusterRef.current()
      setZoom(map.getZoom())
    })
    mapRef.current = map
    setZoom(map.getZoom())
    setMapReady(true)
  }, [])

  // Leaflet calcula el tamaño del contenedor al inicializarse; si el layout
  // cambia después (rotación, cambio móvil↔escritorio, apertura del cajón) los
  // tiles se quedan grises hasta que se le avisa. Observamos el contenedor y
  // reaccionamos también a resize de ventana.
  useEffect(() => {
    if (!mapReady || !mapEl.current) return
    const map = mapRef.current
    if (!map) return
    const invalidate = () => map.invalidateSize()
    const ro = new ResizeObserver(invalidate)
    ro.observe(mapEl.current)
    window.addEventListener('resize', invalidate)
    window.addEventListener('orientationchange', invalidate)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', invalidate)
      window.removeEventListener('orientationchange', invalidate)
    }
  }, [mapReady])

  // Mientras el cajón está abierto en móvil, bloqueamos el scroll del fondo.
  // (En escritorio el cajón no existe, así que el bloqueo no debe aplicarse;
  // esto también lo libera si se redimensiona la ventana a escritorio.)
  useEffect(() => {
    if (!filtersOpen || !isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [filtersOpen, isMobile])

  // Clustering propio por rejilla de pantalla: agrupa puntos cercanos en
  // píxeles. 1 punto → marcador normal; varios → burbuja con el recuento que
  // al pulsarse hace zoom. Se recalcula cuando cambian items/selección/vista.
  useEffect(() => {
    const recluster = () => {
      const map = mapRef.current
      const layer = layerRef.current
      if (!map || !layer) return
      layer.clearLayers()

      const cells = new Map<string, BattlePoint[]>()
      for (const b of items) {
        const p = map.latLngToContainerPoint([b.latitude, b.longitude])
        const key = `${Math.floor(p.x / CLUSTER_CELL)}_${Math.floor(p.y / CLUSTER_CELL)}`
        const arr = cells.get(key)
        if (arr) arr.push(b)
        else cells.set(key, [b])
      }

      for (const group of cells.values()) {
        if (group.length === 1) {
          addBattleMarker(group[0], layer, selectedId, setSelectedId, navigate)
        } else {
          addClusterMarker(group, layer, map)
        }
      }
    }
    reclusterRef.current = recluster
    recluster()
  }, [items, selectedId, navigate, mapReady])

  // Centra y abre popup del seleccionado (subiendo el zoom para "desagrupar").
  useEffect(() => {
    if (!selectedId) return
    const map = mapRef.current
    const b = items.find((x) => x.id === selectedId)
    if (!map || !b) return
    map.flyTo([b.latitude, b.longitude], Math.max(map.getZoom(), 6), { duration: 0.6 })
  }, [selectedId, items])

  // Marker de "foco" cuando llegamos con ?focus=<slug>.
  useEffect(() => {
    const map = mapRef.current
    const layer = focusLayerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    if (!focusBattle || focusBattle.latitude == null || focusBattle.longitude == null) {
      return
    }
    // Centra la ventana de años en la fecha de la batalla, para que aparezca
    // entre los puntos normales (y su contexto de época) en vez de quedar fuera
    // de la ventana por defecto. Salimos del modo zona si estaba activo.
    const ref = focusBattle.year ?? focusBattle.startYear ?? focusBattle.endYear
    if (ref != null) {
      const [lo, hi] = centeredWindow(ref)
      setArea(null)
      setYearMin(lo)
      setYearMax(hi)
    }
    const point: BattlePoint = {
      id: focusBattle.id,
      name: focusBattle.name,
      slug: focusBattle.slug,
      latitude: focusBattle.latitude,
      longitude: focusBattle.longitude,
      year: focusBattle.year,
      startYear: focusBattle.startYear,
      endYear: focusBattle.endYear,
      date: focusBattle.date,
      startDate: focusBattle.startDate,
      endDate: focusBattle.endDate,
      imageUrl: focusBattle.imageUrl,
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
        className: 'bellum-popup',
        maxWidth: 260,
        minWidth: 200,
      })
      .on('popupopen', (e) => bindPopupNavigation(e.popup, point.slug, navigate))
      .addTo(layer)
    map.flyTo([point.latitude, point.longitude], 6, { duration: 0.6 })
    marker.openPopup()
    queueMicrotask(() => setSelectedId(point.id))
  }, [focusBattle, mapReady, navigate])

  // ── Acciones ────────────────────────────────────────────────────────────
  const canSearchArea = zoom >= MIN_AREA_ZOOM

  const searchThisArea = () => {
    const map = mapRef.current
    if (!map || map.getZoom() < MIN_AREA_ZOOM) return
    const b = map.getBounds()
    setArea({ n: b.getNorth(), s: b.getSouth(), e: b.getEast(), w: b.getWest() })
    setSelectedId(null)
  }

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
    setType(null)
    setOnlyRelevant(false)
    setArea(null)
    clearFocus()
  }

  // Filtros activos respecto al estado por defecto (para el contador del botón
  // flotante en móvil). El periodo por defecto no cuenta como filtro.
  const activeFilterCount =
    (q.length > 0 ? 1 : 0) +
    (type != null ? 1 : 0) +
    (onlyRelevant ? 1 : 0) +
    (area != null ? 1 : 0) +
    (yearMin !== DEFAULT_MIN || yearMax !== DEFAULT_MAX ? 1 : 0)

  const hasFilters = activeFilterCount > 0 || focusSlug != null

  const summary = useMemo(() => summarize(items), [items])

  return (
    <div className="map-page">
      <aside className={`map-sidebar${filtersOpen ? ' filters-open' : ''}`}>
        <button
          className="map-filters-backdrop"
          aria-label="Cerrar filtros"
          tabIndex={filtersOpen ? 0 : -1}
          onClick={() => setFiltersOpen(false)}
        />
        <div className="map-filters">
          <div className="map-filters-head">
            <span>Filtros</span>
            <button
              className="map-filters-close"
              aria-label="Cerrar filtros"
              onClick={() => setFiltersOpen(false)}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
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

          {/* Tipo */}
          <div className="filter-group">
            <label className="filter-label">
              <span>Tipo</span>
            </label>
            <div className="chip-row">
              <button
                className={`map-chip ${type == null ? 'active' : ''}`}
                onClick={() => setType(null)}
              >
                Todos
              </button>
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.value}
                  className={`map-chip ${type === t.value ? 'active' : ''}`}
                  onClick={() => setType((cur) => (cur === t.value ? null : t.value))}
                >
                  <TypeIcon type={t.value} size={11} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Relevancia */}
          <label className="map-toggle">
            <input
              type="checkbox"
              checked={onlyRelevant}
              onChange={(e) => setOnlyRelevant(e.target.checked)}
            />
            <span>Solo las más relevantes</span>
          </label>

          {/* Periodo o modo zona */}
          {area ? (
            <div className="filter-group">
              <div className="map-area-chip">
                <Icon name="map" size={13} />
                <span>Zona del mapa · todas las épocas</span>
                <button onClick={() => setArea(null)} aria-label="Quitar zona">
                  ✕
                </button>
              </div>
            </div>
          ) : (
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
          )}

          {hasFilters && (
            <button className="btn-link" onClick={reset} style={{ alignSelf: 'flex-start' }}>
              Restablecer filtros
            </button>
          )}

          {/* Solo móvil: confirma y cierra el cajón mostrando el recuento. */}
          <button
            className="btn btn-primary map-filters-apply"
            onClick={() => setFiltersOpen(false)}
          >
            Ver {loading ? '…' : items.length.toLocaleString('es-ES')} resultado
            {items.length === 1 ? '' : 's'}
          </button>
        </div>

        <div className="map-results">
          <div className="map-results-header">
            <span>{area ? 'En esta zona' : 'Resultados'}</span>
            <span>
              {loading
                ? '…'
                : `${items.length.toLocaleString('es-ES')} registro${items.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {/* Resumen de la zona / selección */}
          {!loading && items.length > 0 && (
            <div className="map-summary">
              {summary.era && <span className="map-summary-era">{summary.era}</span>}
              <span className="map-summary-types">
                {summary.byType.map((t) => (
                  <span key={t.type} className="map-summary-type">
                    <TypeIcon type={t.type} size={10} /> {t.count}
                  </span>
                ))}
              </span>
            </div>
          )}

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
                <SmartImage src={b.imageUrl} alt={b.name} type={b.type} />
              </div>
              <div className="map-result-body">
                <h4 className="map-result-name">{b.name}</h4>
                <div className="map-result-meta">
                  <span>{formatBattleDates(b)}</span>
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

        {/* Botón flotante para abrir el cajón de filtros (solo móvil/tablet). */}
        <button
          className="map-fab-filters"
          onClick={() => setFiltersOpen(true)}
          aria-label="Abrir filtros"
        >
          <Icon name="sliders" size={16} />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="map-fab-count">{activeFilterCount}</span>
          )}
        </button>

        {/* Buscar en esta zona (solo con suficiente zoom) */}
        <button
          className={`map-area-btn ${canSearchArea ? '' : 'is-disabled'}`}
          onClick={searchThisArea}
          disabled={!canSearchArea}
        >
          <Icon name={canSearchArea ? 'search' : 'crosshair'} size={14} />{' '}
          {canSearchArea
            ? 'Buscar en esta zona'
            : 'Acerca el mapa a una zona para buscar'}
        </button>

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

// ── helpers de marcadores ──────────────────────────────────────────────────

function addBattleMarker(
  b: BattlePoint,
  layer: L.LayerGroup,
  selectedId: string | null,
  setSelectedId: (id: string) => void,
  navigate: (path: string) => void,
): void {
  const icon = L.divIcon({
    html: `<div class="battle-pin ${selectedId === b.id ? 'selected' : ''}"></div>`,
    className: 'battle-pin-wrap',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
  const marker = L.marker([b.latitude, b.longitude], { icon })
    .bindPopup(buildPopup(b), { className: 'bellum-popup', maxWidth: 260, minWidth: 200 })
    .on('click', () => setSelectedId(b.id))
    .on('popupopen', (e) => bindPopupNavigation(e.popup, b.slug, navigate))
  marker.addTo(layer)
  if (selectedId === b.id) marker.openPopup()
}

function addClusterMarker(group: BattlePoint[], layer: L.LayerGroup, map: L.Map): void {
  // Centroide del grupo.
  let lat = 0
  let lng = 0
  for (const b of group) {
    lat += b.latitude
    lng += b.longitude
  }
  lat /= group.length
  lng /= group.length

  const n = group.length
  const size = n >= 100 ? 46 : n >= 25 ? 40 : 34
  const icon = L.divIcon({
    html: `<div class="map-cluster" style="width:${size}px;height:${size}px">${n}</div>`,
    className: 'map-cluster-wrap',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  L.marker([lat, lng], { icon })
    .on('click', () => {
      map.flyTo([lat, lng], Math.min(map.getZoom() + 2, 12), { duration: 0.5 })
    })
    .addTo(layer)
}

// ── helpers de resumen ──────────────────────────────────────────────────────

function summarize(items: BattlePoint[]): {
  era: string | null
  byType: { type: BattleType; count: number }[]
} {
  if (items.length === 0) return { era: null, byType: [] }
  const counts = new Map<BattleType, number>()
  let min = Infinity
  let max = -Infinity
  for (const b of items) {
    counts.set(b.type, (counts.get(b.type) ?? 0) + 1)
    const y = b.year ?? b.startYear ?? b.endYear
    if (y != null) {
      if (y < min) min = y
      if (y > max) max = y
    }
  }
  const order: BattleType[] = ['BATTLE', 'SIEGE', 'CAMPAIGN']
  const byType = order
    .filter((t) => counts.has(t))
    .map((t) => ({ type: t, count: counts.get(t)! }))
  const era =
    min === Infinity
      ? null
      : min === max
        ? formatYearLabel(min)
        : `${formatYearLabel(min)} — ${formatYearLabel(max)}`
  return { era, byType }
}

// ── helpers ────────────────────────────────────────────────────────────────

function buildPopup(b: BattlePoint): string {
  const escape = (s: string | null) =>
    (s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
    )
  const year = formatBattleDates(b)
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

// Ventana de MAX_SPAN años centrada en `ref` (la fecha de la batalla queda en
// medio), desplazada si toca los límites para conservar el ancho.
function centeredWindow(ref: number): [number, number] {
  const half = Math.floor(MAX_SPAN / 2)
  let lo = ref - half
  let hi = lo + MAX_SPAN
  if (lo < YEAR_MIN) {
    lo = YEAR_MIN
    hi = Math.min(YEAR_MAX, lo + MAX_SPAN)
  }
  if (hi > YEAR_MAX) {
    hi = YEAR_MAX
    lo = Math.max(YEAR_MIN, hi - MAX_SPAN)
  }
  return [lo, hi]
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
