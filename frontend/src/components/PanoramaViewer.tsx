import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Viewer, events as viewerEvents } from '@photo-sphere-viewer/core'
import { MarkersPlugin, events as markerEvents, type MarkerConfig } from '@photo-sphere-viewer/markers-plugin'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import type { Hotspot } from '../domain/game'
import { useLanguage } from '../language'
import { JourneyLoader } from './JourneyLoader'

const viewerLanguages = {
  ru: { loading: 'Загрузка…', loadError: 'Не удалось загрузить панораму', twoFingers: 'Используйте два пальца для перемещения', ctrlZoom: 'Ctrl + прокрутка для масштабирования' },
  tt: { loading: 'Йөкләнә…', loadError: 'Панораманы йөкләп булмады', twoFingers: 'Хәрәкәт итү өчен ике бармак кулланыгыз', ctrlZoom: 'Зурайту өчен Ctrl + әйләндерү' },
}

type Props = {
  activeHotspot?: Hotspot | null
  children?: ReactNode
  panorama: string
  hotspots?: Hotspot[]
  onHotspotEnter?: (hotspot: Hotspot) => void
  onHotspotLeave?: (hotspot: Hotspot) => void
  onHotspotSelect?: (hotspot: Hotspot) => void
}

export function PanoramaViewer({ activeHotspot, children, panorama, hotspots = [], onHotspotEnter, onHotspotLeave, onHotspotSelect }: Props) {
  const { t, language } = useLanguage()
  const languageRef = useRef(language)
  languageRef.current = language
  const anchorRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const viewerRef = useRef<Viewer | null>(null)
  const activeHotspotRef = useRef(activeHotspot)
  const fadedHotspotRef = useRef<string | null>(null)
  if (activeHotspot?.id !== activeHotspotRef.current?.id) fadedHotspotRef.current = null
  activeHotspotRef.current = activeHotspot
  const updateAnchor = useCallback(() => {
    const viewer = viewerRef.current
    const anchor = anchorRef.current
    const hotspot = activeHotspotRef.current
    if (!viewer || !anchor || !hotspot) return
    const position = { yaw: hotspot.yaw, pitch: hotspot.pitch }
    const point = viewer.dataHelper.sphericalCoordsToViewerCoords(position)
    const camera = viewer.getPosition()
    const yawAngle = Math.abs(Math.atan2(Math.sin(camera.yaw - position.yaw), Math.cos(camera.yaw - position.yaw))) * 180 / Math.PI
    // The text sits above its point: allow looking up to read it without fading.
    const pitchOffset = (camera.pitch - position.pitch) * 180 / Math.PI
    const pitchAngle = Math.max(0, pitchOffset - 40, -pitchOffset - 20)
    const angle = Math.max(yawAngle, pitchAngle)
    const fade = Math.max(0, Math.min(1, (58 - angle) / 22))
    const opacity = fade * fade * (3 - 2 * fade)
    anchor.style.opacity = String(opacity)
    anchor.style.pointerEvents = opacity > 0.15 ? 'auto' : 'none'
    anchor.inert = opacity <= 0.15
    anchor.setAttribute('aria-hidden', String(opacity <= 0.15))
    if (angle >= 58 && fadedHotspotRef.current !== hotspot.id) {
      fadedHotspotRef.current = hotspot.id
      callbacksRef.current.onHotspotLeave?.(hotspot)
    }
    // Projection only moves the card. Its size never depends on the camera.
    if (viewer.dataHelper.isPointVisible(position) && Number.isFinite(point.x) && Number.isFinite(point.y)) {
      anchor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`
    }
  }, [])
  useLayoutEffect(updateAnchor, [activeHotspot, updateAnchor])

  const hostRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<MarkersPlugin | null>(null)
  const hotspotsRef = useRef(hotspots)
  const callbacksRef = useRef({ onHotspotEnter, onHotspotLeave, onHotspotSelect })

  hotspotsRef.current = hotspots
  callbacksRef.current = { onHotspotEnter, onHotspotLeave, onHotspotSelect }

  useEffect(() => {
    if (!hostRef.current) return
    setLoading(true)
    const viewer = new Viewer({
      container: hostRef.current,
      panorama,
      navbar: false,
      defaultZoomLvl: 5,
      mousewheel: true,
      touchmoveTwoFingers: false,
      loadingImg: undefined,
      lang: viewerLanguages[languageRef.current],
      plugins: [
        MarkersPlugin.withConfig({
          markers: toMarkerConfigs(hotspotsRef.current),
          defaultHoverScale: { amount: 1.12, duration: 120, easing: 'ease-out' },
        }),
      ],
    })

    viewerRef.current = viewer
    viewer.addEventListener(viewerEvents.RenderEvent.type, updateAnchor)

    const plugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin)
    pluginRef.current = plugin
    viewer.addEventListener(viewerEvents.ReadyEvent.type, () => {
      setLoading(false)
      plugin.setMarkers(toMarkerConfigs(hotspotsRef.current))
      updateAnchor()
    }, { once: true })
    viewer.addEventListener(viewerEvents.PanoramaErrorEvent.type, () => setLoading(false))

    const findHotspot = (hotspotId: unknown) => hotspotsRef.current.find((hotspot) => hotspot.id === hotspotId)

    plugin.addEventListener(markerEvents.EnterMarkerEvent.type, () => undefined)
    plugin.addEventListener(markerEvents.SelectMarkerEvent.type, (event) => {
      const hotspot = findHotspot(event.marker.config.data?.hotspotId)
      if (hotspot) callbacksRef.current.onHotspotSelect?.(hotspot)
    })

    return () => {
      viewerRef.current = null
      pluginRef.current = null
      viewer.destroy()
    }
  }, [panorama, updateAnchor])

  useEffect(() => {
    pluginRef.current?.setMarkers(toMarkerConfigs(hotspots))
  }, [hotspots])

  return <>
    <div className="panorama" ref={hostRef} aria-label={t('Панорама исторического события', 'Тарихи вакыйга панорамасы')} />
    {loading && <JourneyLoader />}
    {activeHotspot && <div className="hotspot-anchor" ref={anchorRef} style={{ opacity: 0 }}>
      <div className="hotspot-anchor__content">{children}</div>
    </div>}
  </>
}

function toMarkerConfigs(hotspots: Hotspot[]): MarkerConfig[] {
  return hotspots.map((hotspot, index) => ({
    id: `clue-${hotspot.id}`,
    position: { yaw: hotspot.yaw, pitch: hotspot.pitch },
    html: `<span class="history-hotspot__pulse" aria-hidden="true"><i>${index + 1}</i></span>`,
    size: { width: 52, height: 52 },
    anchor: 'center center',
    className: `history-hotspot-marker history-hotspot-marker--${hotspot.kind}`,
    hoverScale: { amount: 1.12, duration: 120, easing: 'ease-out' },
    data: { hotspotId: hotspot.id },
  }))
}
