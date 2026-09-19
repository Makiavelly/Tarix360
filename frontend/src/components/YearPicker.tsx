import { useMemo, useRef } from 'react'
import { useLanguage } from '../language'
import { axisToYear, formatYear, maximumYear, minimumYear, yearToAxis } from '../domain/years'

type Props = { year: number; disabled?: boolean; onChange: (year: number) => void; legend?: boolean }
const pixelsPerYear = 1.5

export function YearPicker({ year, disabled = false, onChange, legend = false }: Props) {
  const { t, language } = useLanguage()
  const axis = yearToAxis(year)
  const dragRef = useRef<{ x: number; axis: number } | null>(null)
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
    const next = axisToYear(Math.round(value))
    if (Number.isFinite(next)) onChange(Math.min(maximumYear, Math.max(minimumYear, next)))
  }
  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    event.currentTarget.classList.remove('is-dragging')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
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
        dragRef.current = { x: event.clientX, axis }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.classList.add('is-dragging')
      }}
      onPointerMove={(event) => { if (dragRef.current && !disabled) updateAxis(dragRef.current.axis - (event.clientX - dragRef.current.x) / pixelsPerYear) }}
      onPointerUp={stopDrag} onPointerCancel={stopDrag}
      onWheel={(event) => { if (!disabled) updateAxis(axis + Math.sign(event.deltaY) * 10) }}
      onKeyDown={(event) => {
        if (disabled) return
        const values: Record<string, number> = { ArrowLeft: axis - 1, ArrowRight: axis + 1, PageDown: axis - 100, PageUp: axis + 100, Home: yearToAxis(minimumYear), End: maximumYear }
        if (event.key in values) { event.preventDefault(); updateAxis(values[event.key]) }
      }}>
      <div className="timeline__pointer timeline__pointer--top" />
      <div className="timeline__ticks" aria-hidden="true" style={{ transform: `translate3d(${-axis * pixelsPerYear}px, 0, 0)` }}>
        {ticks.map((value) => <span key={value} style={{ left: yearToAxis(value) * pixelsPerYear }} className={`timeline__tick ${value % 100 === 0 || value === maximumYear ? 'is-major' : ''}`}>
          {(value % 100 === 0 || value === maximumYear) && <b>{Math.abs(value)}{value < 0 && <small>{t('до н. э.', 'б. э. кадәр')}</small>}</b>}
        </span>)}
      </div>
      <div className="timeline__pointer timeline__pointer--bottom" />
    </div>
  </div>
}
