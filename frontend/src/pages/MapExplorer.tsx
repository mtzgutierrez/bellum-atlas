import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import SmartImage, { TYPE_LABEL } from '../components/SmartImage'
import TypeIcon from '../components/TypeIcon'
import { useApiFetch } from '../hooks/useApiFetch'
import { useDebounce } from '../hooks/useDebounce'
import { battleService } from '../services/battle.service'
import type { BattleSummary } from '../services/battle.types'
import { formatYear } from '../utils/dates'

const YEAR_MIN = -3000
const YEAR_MAX = new Date().getFullYear()

interface Center {
  lat: number
  lng: number
}

export default function MapExplorer() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [yearMin, setYearMin] = useState(YEAR_MIN)
  const [yearMax, setYearMax] = useState(YEAR_MAX)
  const [radiusOn, setRadiusOn] = useState(false)
  const [radiusKm, setRadiusKm] = useState(500)
  const [center, setCenter] = useState<Center | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const debouncedQ = useDebounce(q, 300)

  // Selección del fetcher según los filtros activos.
  const fetcher = useCallback(() => {
    if (radiusOn && center) {
      return battleService.buscarPorCoordenadas(
        { latitude: center.lat, longitude: center.lng, radius: radiusKm },
        { page, pageSize: 50 },
      )
    }
    const text = debouncedQ.trim()
    if (text.length >= 2) {
      return battleService.buscarPorNombre(text, { page, pageSize: 50 })
    }
    if (yearMin !== YEAR_MIN || yearMax !== YEAR_MAX) {
      return battleService.buscarPorPeriodo(
        { startDate: isoStart(yearMin), endDate: isoEnd(yearMax) },
        { page, pageSize: 50 },
      )
    }
    return battleService.listar({ page, pageSize: 50 })
  }, [debouncedQ, yearMin, yearMax, radiusOn, center, radiusKm, page])

  const { data, loading } = useApiFetch(fetcher, [
    debouncedQ,
    yearMin,
    yearMax,
    radiusOn,
    center?.lat,
    center?.lng,
    radiusKm,
    page,
  ])
  const items = useMemo(() => data?.data ?? [], [data])
  const meta = data?.meta

  // ── Leaflet setup ──────────────────────────────────────────────────────
  const mapRef = useRef<L.Map | null>(null)
  const mapEl = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const centerMarkerRef = useRef<L.Marker | null>(null)
  const markersById = useRef<Map<string, L.Marker>>(new Map())

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
    mapRef.current = map
  }, [])

  // Click en mapa: si modo radio, fija el centro.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onClick = (e: L.LeafletMouseEvent) => {
      if (!radiusOn) return
      setCenter({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
    map.on('click', onClick)
    return () => {
      map.off('click', onClick)
    }
  }, [radiusOn])

  // Pinta pines cuando cambian los items o la selección.
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    markersById.current.clear()

    for (const b of items) {
      if (b.latitude == null || b.longitude == null) continue
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
      marker.addTo(layer)
      markersById.current.set(b.id, marker)
    }
  }, [items, selectedId])

  // Círculo de radio + marker del centro.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (circleRef.current) {
      circleRef.current.remove()
      circleRef.current = null
    }
    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove()
      centerMarkerRef.current = null
    }
    if (radiusOn && center) {
      circleRef.current = L.circle([center.lat, center.lng], {
        radius: radiusKm * 1000,
        color: '#C0392B',
        weight: 1.5,
        opacity: 0.9,
        fillColor: '#C0392B',
        fillOpacity: 0.08,
      }).addTo(map)
      centerMarkerRef.current = L.marker([center.lat, center.lng], {
        icon: L.divIcon({
          html: '<div style="width:14px;height:14px;border:2px solid #C0392B;background:#0d0d0d;transform:rotate(45deg)"></div>',
          className: 'center-marker',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      }).addTo(map)
    }
  }, [radiusOn, center, radiusKm])

  // Centra y abre popup del seleccionado.
  useEffect(() => {
    if (!selectedId) return
    const map = mapRef.current
    const marker = markersById.current.get(selectedId)
    if (!map || !marker) return
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 5), { duration: 0.6 })
    marker.openPopup()
  }, [selectedId])

  // Reset filtros: limpia query/años/radio/centro y vuelve a la primera página.
  const reset = () => {
    setQ('')
    setYearMin(YEAR_MIN)
    setYearMax(YEAR_MAX)
    setRadiusOn(false)
    setCenter(null)
    setRadiusKm(500)
    setPage(1)
  }

  const hasFilters =
    q.length > 0 ||
    radiusOn ||
    yearMin !== YEAR_MIN ||
    yearMax !== YEAR_MAX

  return (
    <div className="map-page">
      <aside className="map-sidebar">
        <div className="map-filters">
          <div className="filter-group">
            <label className="filter-label">
              <span>Buscar por nombre</span>
              {q && (
                <button className="btn-link" onClick={() => { setQ(''); setPage(1) }}>
                  Limpiar
                </button>
              )}
            </label>
            <div className="input-with-icon">
              <Icon name="search" size={16} />
              <input
                className="input"
                type="text"
                placeholder="Waterloo, Trafalgar, Stalingrado…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
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
              valueMin={yearMin}
              valueMax={yearMax}
              onChange={(a, b) => {
                setYearMin(a)
                setYearMax(b)
                setPage(1)
              }}
            />
          </div>

          <div className="filter-group">
            <button
              className={`radius-toggle ${radiusOn ? 'active' : ''}`}
              onClick={() => {
                setRadiusOn((v) => !v)
                setPage(1)
              }}
            >
              <span className="radius-toggle-icon">
                <Icon name="crosshair" size={16} />
              </span>
              <span className="radius-toggle-text">
                <strong>Búsqueda por radio</strong>
                <small>
                  {radiusOn
                    ? center
                      ? `Centro: ${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`
                      : 'Pulsa en el mapa para fijar centro'
                    : 'Filtra por distancia geográfica'}
                </small>
              </span>
            </button>
            {radiusOn && (
              <div style={{ padding: '8px 0 0' }}>
                <label className="filter-label">
                  <span>Radio</span>
                  <span className="value">{radiusKm.toLocaleString('es-ES')} km</span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={radiusKm}
                  onChange={(e) => {
                    setRadiusKm(Number(e.target.value))
                    setPage(1)
                  }}
                  style={{ width: '100%', accentColor: '#C0392B' }}
                />
                {center && (
                  <button
                    className="btn-link"
                    onClick={() => setCenter(null)}
                    style={{ marginTop: 6 }}
                  >
                    Quitar centro
                  </button>
                )}
              </div>
            )}
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
                : `${meta?.total.toLocaleString('es-ES') ?? 0} registro${meta?.total === 1 ? '' : 's'}`}
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
                <SmartImage src={b.imageUrl} alt={b.name} type={b.type} />
              </div>
              <div className="map-result-body">
                <h4 className="map-result-name">{b.name}</h4>
                <div className="map-result-meta">
                  <span>{formatYear(b.date)}</span>
                  <span className="dot">·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <TypeIcon type={b.type} size={10} /> {b.type ? TYPE_LABEL[b.type] : '—'}
                  </span>
                  <span className="dot">·</span>
                  <span>{b.country ?? '—'}</span>
                </div>
              </div>
            </div>
          ))}

          {meta && meta.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: 16,
                justifyContent: 'center',
                alignItems: 'center',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                className="btn btn-ghost"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </button>
              <span
                className="font-mono"
                style={{ fontSize: 11, color: 'var(--color-text-muted)' }}
              >
                {meta.page} / {meta.totalPages}
              </span>
              <button
                className="btn btn-ghost"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="map-canvas">
        <div id="leaflet-map" ref={mapEl} />
        {radiusOn && !center && (
          <div className="radius-helper">
            <span className="dot" />
            Pulsa cualquier punto del mapa para fijar el centro
          </div>
        )}
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

function buildPopup(b: BattleSummary): string {
  const escape = (s: string | null) =>
    (s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
    )
  const date = formatYear(b.date) ?? '—'
  const loc = b.locationName ? `${b.locationName}${b.country ? `, ${b.country}` : ''}` : '—'
  const type = b.type ? TYPE_LABEL[b.type] : '—'
  return `
    <div class="popup-content">
      <div class="name">${escape(b.name)}</div>
      <div class="meta">
        <div>${escape(date)}</div>
        <div>${escape(loc)}</div>
        <div>${escape(type)}</div>
      </div>
      <a class="open-link" href="#/battles/${escape(b.slug)}">Abrir ficha →</a>
    </div>`
}

function formatYearLabel(y: number): string {
  if (y === 0) return '0'
  if (y < 0) return `${Math.abs(y)} AC`
  return String(y)
}

function isoStart(year: number): string {
  return year < 0
    ? `-${String(-year).padStart(6, '0')}-01-01T00:00:00.000Z`
    : `${String(year).padStart(4, '0')}-01-01T00:00:00.000Z`
}

function isoEnd(year: number): string {
  return year < 0
    ? `-${String(-year).padStart(6, '0')}-12-31T23:59:59.999Z`
    : `${String(year).padStart(4, '0')}-12-31T23:59:59.999Z`
}

// ── DualRange ──────────────────────────────────────────────────────────────

function DualRange({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (a: number, b: number) => void
}) {
  const fill = {
    left: `${((valueMin - min) / (max - min)) * 100}%`,
    right: `${100 - ((valueMax - min) / (max - min)) * 100}%`,
  }
  const update = (which: 'a' | 'b', raw: string) => {
    const v = Number.parseInt(raw, 10)
    if (which === 'a') onChange(Math.min(v, valueMax - 1), valueMax)
    else onChange(valueMin, Math.max(v, valueMin + 1))
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
