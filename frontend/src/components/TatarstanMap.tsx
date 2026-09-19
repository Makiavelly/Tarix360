import { useEffect, useRef } from 'react'
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Coordinates } from '../domain/game'
import { useLanguage } from '../language'

type MapProps = {
  selected?: Coordinates | null
  answer?: Coordinates
  disabled?: boolean
  hero?: boolean
  className?: string
  animateReveal?: boolean
  expanded?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  onLeave?: () => void
  onInteractionChange?: (active: boolean) => void
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

export function TatarstanMap({ selected = null, answer, disabled = false, hero = false, className = '', animateReveal = false, expanded, onExpand, onCollapse, onLeave, onInteractionChange, onSelect }: MapProps) {
  const { t, language } = useLanguage()
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const resultLayerRef = useRef<LayerGroup | null>(null)
  const onSelectRef = useRef(onSelect)
  const disabledRef = useRef(disabled)
  const interactionRef = useRef(onInteractionChange)
  onSelectRef.current = onSelect
  disabledRef.current = disabled
  interactionRef.current = onInteractionChange

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return

    const map = L.map(hostRef.current, {
      center: hero ? [55.38, 49.75] : [55.35, 50.5],
      zoom: hero ? 6 : 7,
      minZoom: 3,
      maxZoom: 19,
      zoomSnap: .1,
      zoomDelta: .25,
      wheelPxPerZoomLevel: 190,
      wheelDebounceTime: 120,
      zoomControl: !hero,
      attributionControl: true,
      dragging: !hero,
      scrollWheelZoom: !hero,
      doubleClickZoom: !hero,
      keyboard: !hero,
      boxZoom: !hero,
      tapHold: !hero,
    })
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>')

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
      map.on('movestart zoomstart dragstart', () => interactionRef.current?.(true))
      map.on('moveend zoomend dragend', () => interactionRef.current?.(false))
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
      L.polyline([[selected.lat, selected.lng], [answer.lat, answer.lng]], { color: '#193f35', weight: 3, dashArray: '4 9', noClip: true, smoothFactor: 0, className: animateReveal ? 'result-route' : '' }).addTo(layer)
      const bounds: L.LatLngBoundsExpression = [[selected.lat, selected.lng], [answer.lat, answer.lng]]
      const options: L.FitBoundsOptions = animateReveal
        ? { paddingTopLeft: [55, 170], paddingBottomRight: [55, Math.min(300, map.getSize().y * .4)], maxZoom: 11, duration: 1.5 }
        : { padding: [38, 38], maxZoom: 11 }
      if (animateReveal && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.flyToBounds(bounds, options)
      else map.fitBounds(bounds, options)
    }
    return () => { if (mapRef.current === map) map.stop() }
  }, [selected, answer, hero, animateReveal])

  useEffect(() => {
    const controls = hostRef.current
    const labels = language === 'tt' ? ['Зурайту', 'Кечерәйтү'] : ['Приблизить', 'Отдалить']
    for (const [index, selector] of ['.leaflet-control-zoom-in', '.leaflet-control-zoom-out'].entries()) {
      const button = controls?.querySelector(selector)
      button?.setAttribute('title', labels[index])
      button?.setAttribute('aria-label', labels[index])
    }
  }, [language, hero])

  if (hero) return <div className={`hero-map ${className}`} ref={hostRef} aria-hidden="true" />

  return (
    <div className={`map-shell ${className} ${expanded ? 'is-expanded' : ''} ${animateReveal ? 'is-animated-reveal' : ''}`} onPointerEnter={(event) => { if (event.pointerType === 'mouse') onExpand?.() }} onPointerLeave={onLeave} onFocus={onExpand}>
      <div className="real-map" ref={hostRef} role="application" aria-label={t('Интерактивная карта OpenStreetMap', 'OpenStreetMap интерактив картасы')} />
      {expanded && onCollapse && <button className="map-collapse" onClick={onCollapse} aria-label={t('Свернуть карту', 'Картаны кечерәйтү')}>−</button>}
    </div>
  )
}
