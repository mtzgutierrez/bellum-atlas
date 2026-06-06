import L from 'leaflet'
import { useEffect, useRef } from 'react'

// Mini-mapa estático centrado en una batalla. Reutiliza los tiles oscuros de
// Carto del explorador. No es interactivo (sin scroll-zoom) para que no robe
// el scroll de la página.
interface BattleMiniMapProps {
  latitude: number
  longitude: number
  name: string
}

export default function BattleMiniMap({ latitude, longitude, name }: BattleMiniMapProps) {
  const el = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (mapRef.current || !el.current) return
    const map = L.map(el.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([latitude, longitude], 5)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
      pane: 'shadowPane',
    }).addTo(map)

    L.marker([latitude, longitude], {
      icon: L.divIcon({
        html: '<div class="battle-pin selected"></div>',
        className: 'battle-pin-wrap',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    })
      .bindTooltip(name, { direction: 'top', offset: [0, -8] })
      .addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude, name])

  return (
    <div
      ref={el}
      style={{
        height: 260,
        width: '100%',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    />
  )
}
