import { useEffect, useState } from 'react'
import { BookOpenText } from 'lucide-react'
import { useLanguage } from '../language'

export function LegendHint() {
  const { t } = useLanguage()
  const [intro, setIntro] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pinned, setPinned] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setIntro(false), 5000); return () => clearTimeout(timer) }, [])
  const open = intro || hovered || focused || pinned
  return <div className="legend-hint" onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true) }} onPointerLeave={() => setHovered(false)}>
    <button type="button" aria-label={t('Подсказка для сказки', 'Әкият өчен киңәш')} aria-expanded={open} aria-controls="legend-tip"
      onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) setFocused(true) }} onBlur={() => setFocused(false)}
      onClick={() => { setIntro(false); setPinned((value) => !value) }}><BookOpenText /></button>
    <aside id="legend-tip" className={`legend-tip ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <strong>{t('Вы внутри сказки', 'Сез әкият эчендә')}</strong>
      <p>{t('Укажите год написания сказки и место, где происходит действие.', 'Әкиятнең язылган елын һәм вакыйгалар барган урынны күрсәтегез.')}</p>
    </aside>
  </div>
}
