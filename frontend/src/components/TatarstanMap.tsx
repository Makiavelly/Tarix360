import { useEffect, useRef } from 'react'
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'
import type { Coordinates } from '../domain/game'

type MapProps = {
  selected?: Coordinates | null
  answer?: Coordinates
  disabled?: boolean
  hero?: boolean
  className?: string
  onSelect?: (coordinates: Coordinates) => void
}

const heroLocations: Coordinates[] = [
  { lat: 55.7986, lng: 49.1052 },
  { lat: 54.9749, lng: 49.0303 },
  { lat: 55.7411, lng: 52.3992 },
]

function markerIcon(kind: 'guess' | 'answer' | 'hero') {
  return L.divIcon({
    className: `map-marker map-marker--${kind}`,
    html: '<span></span>',
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  })
}

export function TatarstanMap({ selected = null, answer, disabled = false, hero = false, className = '', onSelect }: MapProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const resultLayerRef = useRef<LayerGroup | null>(null)
  const onSelectRef = useRef(onSelect)
  const disabledRef = useRef(disabled)
  onSelectRef.current = onSelect
  disabledRef.current = disabled

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return

    const map = L.map(hostRef.current, {
      center: hero ? [55.38, 49.75] : [55.35, 50.5],
      zoom: hero ? 6 : 7,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: !hero,
      attributionControl: true,
      dragging: !hero,
      scrollWheelZoom: !hero,
      doubleClickZoom: !hero,
      keyboard: !hero,
      boxZoom: !hero,
      tapHold: !hero,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    if (hero) {
      heroLocations.forEach((location) => L.marker([location.lat, location.lng], { icon: markerIcon('hero'), interactive: false }).addTo(map))
    } else {
      map.on('click', (event) => {
        if (!disabledRef.current) onSelectRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng })
      })
    }

    const resultLayer = L.layerGroup().addTo(map)
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(hostRef.current)
    mapRef.current = map
    resultLayerRef.current = resultLayer

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      resultLayerRef.current = null
    }
  }, [hero])

  useEffect(() => {
    const map = mapRef.current
    const layer = resultLayerRef.current
    if (!map || !layer || hero) return
    layer.clearLayers()

    if (selected) L.marker([selected.lat, selected.lng], { icon: markerIcon('guess') }).addTo(layer)
    if (answer) L.marker([answer.lat, answer.lng], { icon: markerIcon('answer') }).addTo(layer)
    if (selected && answer) {
      L.polyline([[selected.lat, selected.lng], [answer.lat, answer.lng]], { color: '#193f35', weight: 3, dashArray: '7 7' }).addTo(layer)
      map.fitBounds([[selected.lat, selected.lng], [answer.lat, answer.lng]], { padding: [38, 38], maxZoom: 11 })
    }
  }, [selected, answer, hero])

  if (hero) return <div className={`hero-map ${className}`} ref={hostRef} aria-hidden="true" />

  return (
    <div className={`map-shell ${className}`}>
      <div className="map-title"><MapPin size={15} /> Укажите место на карте</div>
      <div className="real-map" ref={hostRef} role="application" aria-label="Интерактивная карта OpenStreetMap" />
    </div>
  )
}
