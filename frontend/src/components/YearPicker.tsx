import { useMemo, useRef, useState } from 'react'

type Props = { year: number; disabled?: boolean; onChange: (year: number) => void }

const minimumYear = 800
const maximumYear = 2026
const renderedStartYear = 400
const renderedEndYear = 2400
const minorTickYears = 10
const pixelsPerYear = 1.5

export function YearPicker({ year, disabled = false, onChange }: Props) {
  const dragRef = useRef<{ x: number; year: number } | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const ticks = useMemo(() => Array.from(
    { length: (renderedEndYear - renderedStartYear) / minorTickYears + 1 },
    (_, index) => {
      const value = renderedStartYear + index * minorTickYears
      return { value, major: value % 100 === 0 }
    },
  ), [])
  const offset = (year - renderedStartYear) * pixelsPerYear

  function update(value: number) {
    setHasInteracted(true)
    onChange(Math.min(maximumYear, Math.max(minimumYear, Math.round(value))))
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    dragRef.current = { x: event.clientX, year }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.classList.add('is-dragging')
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || disabled) return
    const distance = event.clientX - dragRef.current.x
    if (Math.abs(distance) >= 1) update(dragRef.current.year - distance / pixelsPerYear)
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    event.currentTarget.classList.remove('is-dragging')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div className="year-picker">
      <div className="year-picker__question" aria-live="polite">
        {hasInteracted ? `${year} н. э.` : 'Когда?'}
      </div>
      <div
        className={`timeline ${disabled ? 'is-disabled' : ''}`}
        role="slider"
        aria-label="Предполагаемый год"
        aria-valuemin={minimumYear}
        aria-valuemax={maximumYear}
        aria-valuenow={year}
        aria-valuetext={`${year} год нашей эры`}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onWheel={(event) => {
          if (disabled) return
          event.preventDefault()
          update(year + Math.sign(event.deltaY) * minorTickYears)
        }}
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'ArrowLeft') update(year - 1)
          if (event.key === 'ArrowRight') update(year + 1)
          if (event.key === 'PageDown') update(year - 100)
          if (event.key === 'PageUp') update(year + 100)
        }}
      >
        <div className="timeline__pointer timeline__pointer--top" />
        <div
          className="timeline__ticks"
          aria-hidden="true"
          style={{ transform: `translate3d(-${offset}px, 0, 0)` }}
        >
          {ticks.map((tick) => (
            <span className={`timeline__tick ${tick.major ? 'is-major' : ''}`} key={tick.value}>
              {tick.major && <b>{tick.value}</b>}
            </span>
          ))}
        </div>
        <div className="timeline__pointer timeline__pointer--bottom" />
      </div>
    </div>
  )
}

