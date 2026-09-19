import { ArrowRight, BookOpenText, Check, CircleHelp, History, LoaderCircle, Map, RotateCcw, X } from 'lucide-react'
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
  const [selectedPanoramaUrl, setSelectedPanoramaUrl] = useState(round.panoramaUrl)
  const [timeTravelOpen, setTimeTravelOpen] = useState(false)
  const [showDescription, setShowDescription] = useState(true)
  const [showResultMap, setShowResultMap] = useState(true)
  const revealed = Boolean(round.result && round.reveal)
  const activeHotspot = hoveredHotspot ?? pinnedHotspot
  const panoramaTimeline = round.reveal?.panoramaTimeline ?? []
  const activeMoment = panoramaTimeline.find((moment) => moment.panoramaUrl === selectedPanoramaUrl)
  const showingOriginalPanorama = selectedPanoramaUrl === round.panoramaUrl

  useEffect(() => {
    setYear(1200)
    setSelected(null)
    setHoveredHotspot(null)
    setPinnedHotspot(null)
    setSelectedPanoramaUrl(round.panoramaUrl)
    setTimeTravelOpen(false)
    setShowDescription(true)
    setShowResultMap(true)
  }, [round.id, round.panoramaUrl])

  const guessedPoint = revealed ? round.result!.guess.coordinates : selected

  return (
    <main className={`game-screen ${revealed ? 'is-revealed' : ''}`}>
      <PanoramaViewer
        panorama={selectedPanoramaUrl}
        hotspots={revealed && showingOriginalPanorama ? round.reveal!.hotspots : []}
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

      {revealed && panoramaTimeline.length > 1 && (
        <>
          <button
            className={`time-travel-button ${showingOriginalPanorama ? '' : 'is-active'}`}
            type="button"
            aria-expanded={timeTravelOpen}
            onClick={() => setTimeTravelOpen((open) => !open)}
          >
            <History />
            <span>{activeMoment ? `${activeMoment.year} · другие годы` : 'Другие годы'}</span>
          </button>

          {timeTravelOpen && (
            <section className="time-travel-dock" aria-label="Панорамы этого места в разные годы">
              <header>
                <div><span>То же место</span><h2>Кремль сквозь время</h2></div>
                <button type="button" aria-label="Закрыть выбор года" onClick={() => setTimeTravelOpen(false)}><X /></button>
              </header>
              <div className="time-travel-dock__moments">
                {panoramaTimeline.map((moment) => (
                  <button
                    key={moment.year}
                    type="button"
                    className={moment.panoramaUrl === selectedPanoramaUrl ? 'is-selected' : ''}
                    aria-pressed={moment.panoramaUrl === selectedPanoramaUrl}
                    onClick={() => {
                      setSelectedPanoramaUrl(moment.panoramaUrl)
                      setHoveredHotspot(null)
                      setPinnedHotspot(null)
                    }}
                  >
                    <strong>{moment.year}</strong>
                    <span><b>{moment.title}</b><small>{moment.description}</small></span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

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
        <div className={`reveal-panel ${showDescription ? '' : 'is-description-hidden'} ${showResultMap ? '' : 'is-map-hidden'}`}>
          <div className="reveal-panel__toolbar" aria-label="Настройка панели результата">
            <span>Показывать</span>
            <button
              type="button"
              className={showDescription ? 'is-active' : ''}
              aria-pressed={showDescription}
              aria-label={showDescription ? 'Скрыть описание' : 'Показать описание'}
              title={showDescription ? 'Скрыть описание' : 'Показать описание'}
              onClick={() => setShowDescription((visible) => !visible)}
            >
              <BookOpenText /><span>Описание</span>
            </button>
            <button
              type="button"
              className={showResultMap ? 'is-active' : ''}
              aria-pressed={showResultMap}
              aria-label={showResultMap ? 'Скрыть карту' : 'Показать карту'}
              title={showResultMap ? 'Скрыть карту' : 'Показать карту'}
              onClick={() => setShowResultMap((visible) => !visible)}
            >
              <Map /><span>Карта</span>
            </button>
          </div>
          {showDescription && <div className="reveal-panel__story">
            <span className="eyebrow">{round.reveal!.year} · {round.reveal!.place}</span>
            <h1>{round.reveal!.title}</h1>
            <h2>{round.reveal!.subtitle}</h2>
            <p>{round.reveal!.description}</p>
            <a href={round.reveal!.sourceUrl} target="_blank" rel="noreferrer">Источник: {round.reveal!.sourceTitle} ↗</a>
          </div>}
          <div className="reveal-panel__result">
            <div className="metric"><span>Ошибка в дате</span><strong>{round.result!.yearError === 0 ? 'Точно!' : `${round.result!.yearError} ${pluralYears(round.result!.yearError)}`}</strong><small>Ваш ответ: {round.result!.guess.year}</small></div>
            <div className="metric"><span>Ошибка на карте</span><strong>{round.result!.distanceKm === 0 ? 'Точно!' : `${round.result!.distanceKm} км`}</strong><small>Правильное место: {round.reveal!.place}</small></div>
            <div className="metric metric--score"><span>За раунд</span><strong>+{round.result!.score.toLocaleString('ru-RU')}</strong><small>из {round.result!.maximumScore.toLocaleString('ru-RU')}</small></div>
          </div>
          {showResultMap && <div className="reveal-panel__map"><TatarstanMap selected={guessedPoint} answer={round.reveal!.coordinates} disabled /></div>}
          <button className="next-button" onClick={onNext} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : round.number === round.total ? <RotateCcw /> : <ArrowRight />}<span>{round.number === round.total ? 'Итоги' : 'Далее'}</span></button>
        </div>
      )}
    </main>
  )
}

function hotspotKindLabel(kind: Hotspot['kind']) {
  if (kind === 'place') return 'Подсказка о месте'
  if (kind === 'time') return 'Подсказка о времени'
  if (kind === 'legend') return 'Герой легенды'
  if (kind === 'object') return 'Предмет'
  if (kind === 'story') return 'Сюжетная деталь'
  return 'Контекст эпохи'
}

function pluralYears(value: number) {
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return 'год'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года'
  return 'лет'
}
