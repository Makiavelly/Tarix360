import { useEffect, useRef } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'

export function PanoramaViewer({ panorama }: { panorama: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

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
    })
    return () => viewer.destroy()
  }, [panorama])

  return <div className="panorama" ref={hostRef} aria-label="Панорама исторического события" />
}

