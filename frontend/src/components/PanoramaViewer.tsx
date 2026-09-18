import { useEffect, useRef } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { MarkersPlugin, events as markerEvents, type MarkerConfig } from '@photo-sphere-viewer/markers-plugin'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import type { Hotspot } from '../domain/game'

type Props = {
  panorama: string
  hotspots?: Hotspot[]
  onHotspotEnter?: (hotspot: Hotspot) => void
  onHotspotLeave?: (hotspot: Hotspot) => void
  onHotspotSelect?: (hotspot: Hotspot) => void
}

export function PanoramaViewer({ panorama, hotspots = [], onHotspotEnter, onHotspotLeave, onHotspotSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<MarkersPlugin | null>(null)
  const hotspotsRef = useRef(hotspots)
  const callbacksRef = useRef({ onHotspotEnter, onHotspotLeave, onHotspotSelect })

  hotspotsRef.current = hotspots
  callbacksRef.current = { onHotspotEnter, onHotspotLeave, onHotspotSelect }

  useEffect(() => {
    if (!hostRef.current) return
    const viewer = new Viewer({
      container: hostRef.current,
      panorama,
      navbar: false,
      defaultZoomLvl: 5,
      mousewheel: true,
      touchmoveTwoFingers: false,
      loadingImg: undefined,
      plugins: [
        MarkersPlugin.withConfig({
          markers: [],
          defaultHoverScale: { amount: 1.12, duration: 120, easing: 'ease-out' },
        }),
      ],
    })

    const plugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin)
    pluginRef.current = plugin
    plugin.setMarkers(toMarkerConfigs(hotspotsRef.current))

    const findHotspot = (hotspotId: unknown) => hotspotsRef.current.find((hotspot) => hotspot.id === hotspotId)

    plugin.addEventListener(markerEvents.EnterMarkerEvent.type, (event) => {
      const hotspot = findHotspot(event.marker.config.data?.hotspotId)
      if (hotspot) callbacksRef.current.onHotspotEnter?.(hotspot)
    })
    plugin.addEventListener(markerEvents.LeaveMarkerEvent.type, (event) => {
      const hotspot = findHotspot(event.marker.config.data?.hotspotId)
      if (hotspot) callbacksRef.current.onHotspotLeave?.(hotspot)
    })
    plugin.addEventListener(markerEvents.SelectMarkerEvent.type, (event) => {
      const hotspot = findHotspot(event.marker.config.data?.hotspotId)
      if (hotspot) callbacksRef.current.onHotspotSelect?.(hotspot)
    })

    return () => {
      pluginRef.current = null
      viewer.destroy()
    }
  }, [panorama])

  useEffect(() => {
    pluginRef.current?.setMarkers(toMarkerConfigs(hotspots))
  }, [hotspots])

  return <div className="panorama" ref={hostRef} aria-label="Панорама исторического события" />
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
