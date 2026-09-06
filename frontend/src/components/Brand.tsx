import { Sparkles } from 'lucide-react'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? 'brand--light' : ''}`} aria-label="Tarix 360">
      <span className="brand__seal"><Sparkles size={16} strokeWidth={1.8} /></span>
      <span>Tarix 360</span>
    </div>
  )
}

