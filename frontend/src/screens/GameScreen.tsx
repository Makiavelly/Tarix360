import { ArrowRight, Check, CircleHelp, LoaderCircle, RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Coordinates, Game, Hotspot } from '../domain/game'
import { Brand } from '../components/Brand'
import { PanoramaViewer } from '../components/PanoramaViewer'
import { TatarstanMap } from '../components/TatarstanMap'
import { YearPicker } from '../components/YearPicker'

type Props = {
  game: Game
  busy: boolean
  onGuess: (year: number, coordinates: Coordinates) => void
  onNext: () => void
  onExit: () => void
}

export function GameScreen({ game, busy, onGuess, onNext, onExit }: Props) {
  const round = game.currentRound!
  const [year, setYear] = useState(1200)
  const [selected, setSelected] = useState<Coordinates | null>(null)
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null)
  const [pinnedHotspot, setPinnedHotspot] = useState<Hotspot | null>(null)
  const revealed = Boolean(round.result && round.reveal)
  const activeHotspot = hoveredHotspot ?? pinnedHotspot

  useEffect(() => {
    setYear(1200)
    setSelected(null)
    setHoveredHotspot(null)
    setPinnedHotspot(null)
  }, [round.id])

  const guessedPoint = revealed ? round.result!.guess.coordinates : selected

  return (
    <main className={`game-screen ${revealed ? 'is-revealed' : ''}`}>
      <PanoramaViewer
        panorama={round.panoramaUrl}
        hotspots={revealed ? round.reveal!.hotspots : []}
        onHotspotEnter={setHoveredHotspot}
        onHotspotLeave={() => setHoveredHotspot(null)}
        onHotspotSelect={(hotspot) => setPinnedHotspot((current) => current?.id === hotspot.id ? null : hotspot)}
      />
      <div className="pano-vignette" />
      <header className="game-header">
        <button className="brand-button" onClick={onExit}><Brand light /></button>
        <div className="round-chip">Раунд {round.number}<span>/ {round.total}</span></div>
        <div className="score"><span>Очки</span><strong>{game.score.toLocaleString('ru-RU')}</strong></div>
      </header>

      <button className="help-chip" type="button" title="Вращайте панораму мышью или пальцем"><CircleHelp size={18} /> <span>Осмотритесь вокруг</span></button>

      {revealed && activeHotspot && (
        <aside className="hotspot-card" aria-live="polite">
          <div className="hotspot-card__meta">
            <span>Историческая деталь</span>
            <span>{hotspotKindLabel(activeHotspot.kind)}</span>
          </div>
          <h2>{activeHotspot.title}</h2>
          <p>{activeHotspot.description}</p>
          <small>{pinnedHotspot?.id === activeHotspot.id ? 'Точка закреплена' : 'Нажмите на точку, чтобы закрепить'}</small>
          <button
            className="hotspot-card__close"
            type="button"
            aria-label="Закрыть описание"
            onClick={() => {
              setHoveredHotspot(null)
              setPinnedHotspot(null)
            }}
          >
            <X />
          </button>
        </aside>
      )}

      {!revealed && (
        <div className="guess-dock">
          <YearPicker key={round.id} year={year} onChange={setYear} disabled={busy} />
          <TatarstanMap className="guess-map" selected={selected} onSelect={setSelected} disabled={busy} />
          <button className="answer-button" onClick={() => selected && onGuess(year, selected)} disabled={!selected || busy}>
            {busy ? <LoaderCircle className="spin" /> : <Check />}<span>{selected ? 'Ответить' : 'Выберите место'}</span>
          </button>
        </div>
      )}

      {revealed && (
        <div className="reveal-panel">
          <div className="reveal-panel__story">
            <span className="eyebrow">{round.reveal!.year} · {round.reveal!.place}</span>
            <h1>{round.reveal!.title}</h1>
            <h2>{round.reveal!.subtitle}</h2>
            <p>{round.reveal!.description}</p>
            <a href={round.reveal!.sourceUrl} target="_blank" rel="noreferrer">Источник: {round.reveal!.sourceTitle} ↗</a>
          </div>
          <div className="reveal-panel__result">
            <div className="metric"><span>Ошибка в дате</span><strong>{round.result!.yearError === 0 ? 'Точно!' : `${round.result!.yearError} ${pluralYears(round.result!.yearError)}`}</strong><small>Ваш ответ: {round.result!.guess.year}</small></div>
            <div className="metric"><span>Ошибка на карте</span><strong>{round.result!.distanceKm === 0 ? 'Точно!' : `${round.result!.distanceKm} км`}</strong><small>Правильное место: {round.reveal!.place}</small></div>
            <div className="metric metric--score"><span>За раунд</span><strong>+{round.result!.score.toLocaleString('ru-RU')}</strong><small>из {round.result!.maximumScore.toLocaleString('ru-RU')}</small></div>
          </div>
          <div className="reveal-panel__map"><TatarstanMap selected={guessedPoint} answer={round.reveal!.coordinates} disabled /></div>
          <button className="next-button" onClick={onNext} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : round.number === round.total ? <RotateCcw /> : <ArrowRight />}<span>{round.number === round.total ? 'Итоги' : 'Далее'}</span></button>
        </div>
      )}
    </main>
  )
}

function hotspotKindLabel(kind: Hotspot['kind']) {
  if (kind === 'place') return 'Подсказка о месте'
  if (kind === 'time') return 'Подсказка о времени'
  return 'Контекст эпохи'
}

function pluralYears(value: number) {
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return 'год'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года'
  return 'лет'
}
