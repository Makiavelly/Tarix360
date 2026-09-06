import { useMemo, useRef } from 'react'

type Props = { year: number; disabled?: boolean; onChange: (year: number) => void }

const minimumYear = 800
const maximumYear = 2026
const tickStep = 20

export function YearPicker({ year, disabled = false, onChange }: Props) {
  const dragRef = useRef<{ x: number; year: number } | null>(null)
  const ticks = useMemo(() => Array.from({ length: 49 }, (_, index) => {
    const offset = index - 24
    return { value: year + offset * tickStep, major: offset % 5 === 0, center: offset === 0 }
  }), [year])

  function update(value: number) {
    onChange(Math.min(maximumYear, Math.max(minimumYear, Math.round(value))))
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    dragRef.current = { x: event.clientX, year }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || disabled) return
    update(dragRef.current.year - (event.clientX - dragRef.current.x) * 2)
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div className="year-picker">
      <div className="year-picker__question">Когда?</div>
      <div
        className={`timeline ${disabled ? 'is-disabled' : ''}`}
        role="slider"
        aria-label="Предполагаемый год"
        aria-valuemin={minimumYear}
        aria-valuemax={maximumYear}
        aria-valuenow={year}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onWheel={(event) => { if (!disabled) update(year + Math.sign(event.deltaY) * tickStep) }}
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'ArrowLeft') update(year - 1)
          if (event.key === 'ArrowRight') update(year + 1)
          if (event.key === 'PageDown') update(year - 100)
          if (event.key === 'PageUp') update(year + 100)
        }}
      >
        <div className="timeline__pointer timeline__pointer--top" />
        <div className="timeline__ticks" aria-hidden="true">
          {ticks.map((tick, index) => (
            <span className={`timeline__tick ${tick.major ? 'is-major' : ''} ${tick.center ? 'is-center' : ''}`} key={`${tick.value}-${index}`}>
              {tick.major && <b>{tick.value}</b>}
            </span>
          ))}
        </div>
        <div className="timeline__pointer timeline__pointer--bottom" />
        <output className="timeline__value">{year}</output>
      </div>
      <span className="year-picker__help">тяните шкалу · стрелки — точная настройка</span>
    </div>
  )
}
