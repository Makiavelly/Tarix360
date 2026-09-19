import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../language'
import { axisToYear, formatYear, maximumYear, minimumYear, yearToAxis } from '../domain/years'

type Props = { year: number; disabled?: boolean; onChange: (year: number) => void; legend?: boolean }
const pixelsPerYear = 1.5

export function YearPicker({ year, disabled = false, onChange, legend = false }: Props) {
  const { t, language } = useLanguage()
  const axis = yearToAxis(year)
  const [visualAxis, setVisualAxis] = useState(axis)
  const visualAxisRef = useRef(axis)
  const lastYearRef = useRef(year)
  const inertiaFrameRef = useRef(0)
  const dragRef = useRef<{ x: number; axis: number; lastX: number; lastTime: number; velocity: number } | null>(null)
  useEffect(() => {
    if (!dragRef.current && !inertiaFrameRef.current) {
      visualAxisRef.current = axis
      setVisualAxis(axis)
      lastYearRef.current = year
    }
  }, [axis, year])
  useEffect(() => () => cancelAnimationFrame(inertiaFrameRef.current), [])
  const ticks = useMemo(() => {
    const start = Math.max(minimumYear, Math.floor((year - 500) / 10) * 10)
    const end = Math.min(maximumYear, Math.ceil((year + 500) / 10) * 10)
    const values: number[] = []
    for (let value = start; value <= end; value += 10) if (value !== 0) values.push(value)
    if (start < 1 && end > -1) values.push(-1, 1)
    if (end === maximumYear && !values.includes(maximumYear)) values.push(maximumYear)
    return values.sort((a, b) => a - b)
  }, [year])
  const updateAxis = (value: number) => {
    const bounded = Math.min(yearToAxis(maximumYear), Math.max(yearToAxis(minimumYear), value))
    visualAxisRef.current = bounded
    setVisualAxis(bounded)
    const next = axisToYear(Math.round(bounded))
    if (Number.isFinite(next) && next !== lastYearRef.current) {
      lastYearRef.current = next
      onChange(next)
    }
  }
  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    event.currentTarget.classList.remove('is-dragging')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!drag || Math.abs(drag.velocity) < .003) return
    let velocity = drag.velocity
    let previous = performance.now()
    const glide = (now: number) => {
      const elapsed = Math.min(32, now - previous)
      previous = now
      velocity *= Math.exp(-elapsed / 260)
      updateAxis(visualAxisRef.current + velocity * elapsed)
      const atEdge = visualAxisRef.current <= yearToAxis(minimumYear) || visualAxisRef.current >= yearToAxis(maximumYear)
      if (Math.abs(velocity) > .002 && !atEdge) inertiaFrameRef.current = requestAnimationFrame(glide)
      else inertiaFrameRef.current = 0
    }
    inertiaFrameRef.current = requestAnimationFrame(glide)
  }
  return <div className="year-picker">
    <div className="year-picker__question">
      <label><span>{legend ? t('Год написания', 'Язылган ел') : t('Какой год?', 'Кайсы ел?')}</span>
        <input type="text" inputMode="numeric" value={Math.abs(year)} disabled={disabled}
          aria-label={legend ? t('Год написания сказки', 'Әкият язылган ел') : t('Предполагаемый год', 'Фаразланган ел')}
          onFocus={(event) => { const end = event.currentTarget.value.length; event.currentTarget.setSelectionRange(end, end) }}
          onPointerUp={(event) => { event.preventDefault(); const end = event.currentTarget.value.length; event.currentTarget.setSelectionRange(end, end) }}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '')
            const value = Number(digits)
            if (digits && value > 0) onChange(year < 0 ? -Math.min(-minimumYear, Math.round(value)) : Math.min(maximumYear, Math.round(value)))
          }} />
      </label>
      <button className="era-toggle" disabled={disabled} onClick={() => onChange(year < 0 ? Math.min(maximumYear, -year) : -year)}
        aria-label={t('Переключить эру', 'Эраны алыштыру')}>{year < 0 ? t('до н. э.', 'б. э. кадәр') : t('н. э.', 'б. э.')}</button>
    </div>
    <div className={`timeline ${disabled ? 'is-disabled' : ''}`} role="slider" aria-label={t('Шкала лет', 'Еллар шкаласы')}
      aria-valuemin={minimumYear} aria-valuemax={maximumYear} aria-valuenow={year} aria-valuetext={formatYear(year, language)} aria-disabled={disabled} tabIndex={disabled ? -1 : 0}
      onPointerDown={(event) => {
        if (disabled) return
        cancelAnimationFrame(inertiaFrameRef.current)
        inertiaFrameRef.current = 0
        dragRef.current = { x: event.clientX, axis: visualAxisRef.current, lastX: event.clientX, lastTime: performance.now(), velocity: 0 }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.classList.add('is-dragging')
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current
        if (!drag || disabled) return
        const now = performance.now()
        const elapsed = Math.max(1, now - drag.lastTime)
        const instantVelocity = -(event.clientX - drag.lastX) / pixelsPerYear / elapsed
        drag.velocity = drag.velocity * .7 + instantVelocity * .3
        drag.lastX = event.clientX
        drag.lastTime = now
        updateAxis(drag.axis - (event.clientX - drag.x) / pixelsPerYear)
      }}
      onPointerUp={stopDrag} onPointerCancel={stopDrag}
      onWheel={(event) => { if (!disabled) updateAxis(visualAxisRef.current + Math.sign(event.deltaY) * 10) }}
      onKeyDown={(event) => {
        if (disabled) return
        const values: Record<string, number> = { ArrowLeft: axis - 1, ArrowRight: axis + 1, PageDown: axis - 100, PageUp: axis + 100, Home: yearToAxis(minimumYear), End: maximumYear }
        if (event.key in values) { event.preventDefault(); updateAxis(values[event.key]) }
      }}>
      <div className="timeline__pointer timeline__pointer--top" />
      <div className="timeline__ticks" aria-hidden="true" style={{ transform: `translate3d(${-visualAxis * pixelsPerYear}px, 0, 0)` }}>
        {ticks.map((value) => <span key={value} style={{ left: yearToAxis(value) * pixelsPerYear }} className={`timeline__tick ${value % 100 === 0 || value === maximumYear ? 'is-major' : ''}`}>
          {(value % 100 === 0 || value === maximumYear) && <b>{Math.abs(value)}{value < 0 && <small>{t('до н. э.', 'б. э. кадәр')}</small>}</b>}
        </span>)}
      </div>
      <div className="timeline__pointer timeline__pointer--bottom" />
    </div>
  </div>
}
