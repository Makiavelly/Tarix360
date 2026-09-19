import { ArrowRight, BookOpenText, Check, Clock3, History, LoaderCircle, Map, RotateCcw, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Coordinates, Game, Hotspot } from '../domain/game'
import { TranslatedDescription } from '../components/TranslatedDescription'
import { Brand } from '../components/Brand'
import { PanoramaViewer } from '../components/PanoramaViewer'
import { TatarstanMap } from '../components/TatarstanMap'
import { YearPicker } from '../components/YearPicker'
import { RoundReveal } from '../components/RoundReveal'
import { LanguageToggle } from '../i18n'
import { useLanguage } from '../language'
import { LegendHint } from '../components/LegendHint'
import { useFadingValue, usePresence } from '../usePresence'
import { formatYear } from '../domain/years'

type Props = {
  game: Game
  busy: boolean
  muted: boolean
  volume: number
  onVolumeChange: (volume: number) => void
  onTimeExpired: () => void
  onTimeWarning: (seconds: number) => void
  onHintUsed: () => void
  onGuess: (year: number, coordinates: Coordinates, timedOut?: boolean, hintIds?: string[]) => Promise<void>
  onNext: () => void
  onToggleMuted: () => void
  onExit: () => void
}

const noHotspots: Hotspot[] = []
type ReportSelection = { x: number; y: number; width: number; height: number }

export function GameScreen({ game, busy, muted, volume, onVolumeChange, onTimeExpired, onTimeWarning, onHintUsed, onGuess, onNext, onToggleMuted, onExit }: Props) {
  const { t, localize, language } = useLanguage()
  const round = game.currentRound!
  const [year, setYear] = useState(1200)
  const [selected, setSelected] = useState<Coordinates | null>(null)
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const [usedHintIds, setUsedHintIds] = useState<string[]>([])
  const usedHintIdsRef = useRef(new Set<string>())
  const [hintPulse, setHintPulse] = useState(0)
  const displayedHotspot = useFadingValue(activeHotspot)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [selectedPanoramaUrl, setSelectedPanoramaUrl] = useState(round.panoramaUrl)
  const [timeTravelOpen, setTimeTravelOpen] = useState(false)
  const [showDescription, setShowDescription] = useState(true)
  const descriptionPresent = usePresence(showDescription)
  const timeTravelPresent = usePresence(timeTravelOpen)
  const [panoramaRound, setPanoramaRound] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [timeFraction, setTimeFraction] = useState(1)
  const expirySoundRef = useRef(false)
  const warningSecondRef = useRef<number | null>(null)
  const timeoutSubmittedRef = useRef(false)
  const panoramaViewRef = useRef({ yaw: 0, pitch: 0 })
  const reportStartRef = useRef<{ x: number; y: number } | null>(null)
  const [reportMode, setReportMode] = useState(false)
  const [reportSelection, setReportSelection] = useState<ReportSelection | null>(null)
  const [reportText, setReportText] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportError, setReportError] = useState(false)
  const guessStateRef = useRef({ year, selected, busy, onGuess, onTimeExpired, onTimeWarning, usedHintIds })
  guessStateRef.current = { year, selected, busy, onGuess, onTimeExpired, onTimeWarning, usedHintIds }
  const revealed = Boolean(round.result && round.reveal)
  const panoramaTimeline = round.reveal?.panoramaTimeline ?? []
  const showingOriginalPanorama = selectedPanoramaUrl === round.panoramaUrl

  useEffect(() => {
    setYear(1200)
    setSelected(null)
    setActiveHotspot(null)
    setUsedHintIds([])
    usedHintIdsRef.current.clear()
    setMapExpanded(false)
    setSelectedPanoramaUrl(round.panoramaUrl)
    setTimeTravelOpen(false)
    setShowDescription(true)
    setPanoramaRound(null)
    setSecondsLeft(60)
    setTimeFraction(1)
    expirySoundRef.current = false
    warningSecondRef.current = null
    timeoutSubmittedRef.current = false
    setReportMode(false)
    setReportSelection(null)
    setReportText('')
    setReportSent(false)
    setReportError(false)
  }, [round.id, round.panoramaUrl])

  useEffect(() => {
    if (hintPulse === 0) return
    const timer = window.setTimeout(() => setHintPulse(0), 1400)
    return () => window.clearTimeout(timer)
  }, [hintPulse])

  useEffect(() => {
    if (revealed) setHintPulse(0)
  }, [revealed])

  useEffect(() => {
    if (revealed) return
    const deadline = Date.parse(round.deadline)
    if (Number.isNaN(deadline)) return
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSecondsLeft(remaining)
      setTimeFraction(Math.max(0, Math.min(1, (deadline - Date.now()) / 60000)))
      if (remaining === 0 && !expirySoundRef.current) {
        expirySoundRef.current = true
        guessStateRef.current.onTimeExpired()
      }
      if (remaining > 0 && remaining <= 10 && warningSecondRef.current !== remaining) {
        warningSecondRef.current = remaining
        guessStateRef.current.onTimeWarning(remaining)
      }
      if (remaining === 0 && !timeoutSubmittedRef.current && !guessStateRef.current.busy) {
        timeoutSubmittedRef.current = true
        void guessStateRef.current.onGuess(guessStateRef.current.year, guessStateRef.current.selected ?? { lat: 55.35, lng: 50.5 }, true, guessStateRef.current.usedHintIds)
      }
    }
    updateTimer()
    const interval = window.setInterval(updateTimer, 250)
    return () => window.clearInterval(interval)
  }, [revealed, round.deadline, round.id])

  if (revealed && panoramaRound !== round.id) return <RoundReveal key={round.id} round={round} onContinue={() => setPanoramaRound(round.id)} onExit={onExit} />

  const kindLabel = (kind: Hotspot['kind']) => ({
    place: t('Подсказка о месте', 'Урын турында ишарә'), time: t('Подсказка о времени', 'Вакыт турында ишарә'),
    legend: t('Герой легенды', 'Риваять герое'), object: t('Предмет', 'Әйбер'),
    story: t('Сюжетная деталь', 'Сюжет детале'), context: t('Контекст эпохи', 'Чор турында'),
  })[kind]

  const openHotspot = (hotspot: Hotspot) => {
    setActiveHotspot(hotspot)
    if (!revealed && !usedHintIdsRef.current.has(hotspot.id)) {
      usedHintIdsRef.current.add(hotspot.id)
      setUsedHintIds((ids) => [...ids, hotspot.id])
      setHintPulse((value) => value + 1)
      onHintUsed()
    }
  }

  const availableHotspots = showingOriginalPanorama ? (revealed ? round.reveal!.hotspots : round.hotspots ?? noHotspots) : noHotspots

  const reportPoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) }
  }
  const updateReportSelection = (point: { x: number; y: number }) => {
    const start = reportStartRef.current
    if (!start) return
    setReportSelection({ x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), width: Math.abs(point.x - start.x), height: Math.abs(point.y - start.y) })
  }
  const submitReport = async () => {
    if (!reportSelection || !reportText.trim()) return
    setReportSending(true)
    setReportError(false)
    try {
      const response = await fetch('/api/v1/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, roundId: round.id, panoramaUrl: selectedPanoramaUrl, description: reportText.trim(), ...reportSelection, ...panoramaViewRef.current }),
      })
      if (!response.ok) throw new Error('report failed')
      setReportSent(true)
      window.setTimeout(() => { setReportMode(false); setReportSelection(null); setReportText(''); setReportSent(false) }, 1300)
    } catch { setReportError(true) }
    finally { setReportSending(false) }
  }

  return <main className={`game-screen ${revealed ? 'is-revealed' : ''}`} onPointerDown={(event) => {
    if ((event.target as Element).closest('.panorama')) setMapExpanded(false)
  }}>
    <PanoramaViewer panorama={selectedPanoramaUrl}
      hotspots={availableHotspots}
      activeHotspot={showingOriginalPanorama ? displayedHotspot : null}
      onHotspotLeave={() => setActiveHotspot(null)}
      onHotspotSelect={openHotspot}
      onViewChange={(position) => { panoramaViewRef.current = position }}>
      {displayedHotspot && <aside key={displayedHotspot.id} className={`hotspot-card ornament-panel ${activeHotspot ? '' : 'is-exiting'}`} inert={!activeHotspot}>
        <div className="hotspot-card__meta"><span>{revealed ? t('Историческая деталь', 'Тарихи деталь') : t('Подсказка', 'Ишарә')}</span><span>{kindLabel(displayedHotspot.kind)}</span></div>
        <h2>{localize(displayedHotspot.title, displayedHotspot.titleTt)}</h2>
        <figure className="hotspot-illustration">
          <img src={displayedHotspot.imageUrl} alt={localize(displayedHotspot.title, displayedHotspot.titleTt)} loading="lazy" />
          {displayedHotspot.imageSourceUrl && <figcaption><a href={displayedHotspot.imageSourceUrl} target="_blank" rel="noreferrer">{t('Иллюстрация · источник', 'Иллюстрация · чыганак')} ↗</a><small>{displayedHotspot.imageCredit}</small></figcaption>}
        </figure>
        <TranslatedDescription description={displayedHotspot.description} descriptionTt={displayedHotspot.descriptionTt} />
        <button className="hotspot-card__close" aria-label={t('Закрыть описание', 'Тасвирламаны ябу')} onClick={() => setActiveHotspot(null)}><X /></button>
      </aside>}
    </PanoramaViewer>
    <div className="pano-vignette" />
    {!reportMode && <button className="report-open" type="button" onClick={() => { setReportMode(true); setActiveHotspot(null) }}>{t('Сообщить о неточности', 'Төгәлсезлек турында хәбәр итү')}</button>}
    {reportMode && <>
      <div className="report-select" onPointerDown={(event) => {
        if (reportSelection) return
        event.currentTarget.setPointerCapture(event.pointerId)
        const point = reportPoint(event); reportStartRef.current = point; setReportSelection({ ...point, width: 0, height: 0 })
      }} onPointerMove={(event) => { if (reportStartRef.current) updateReportSelection(reportPoint(event)) }} onPointerUp={(event) => {
        updateReportSelection(reportPoint(event)); reportStartRef.current = null
      }}>
        {reportSelection && <div className="report-selection" style={{ left: `${reportSelection.x * 100}%`, top: `${reportSelection.y * 100}%`, width: `${reportSelection.width * 100}%`, height: `${reportSelection.height * 100}%` }} />}
        {!reportSelection && <p>{t('Выделите область, где есть неточность', 'Төгәлсезлек булган өлкәне билгеләгез')}</p>}
      </div>
      <button className="report-cancel" type="button" onClick={() => { setReportMode(false); setReportSelection(null); reportStartRef.current = null }}>{t('Отмена', 'Баш тарту')}</button>
      {reportSelection && reportSelection.width > .01 && reportSelection.height > .01 && <form className="report-form ornament-panel" onSubmit={(event) => { event.preventDefault(); void submitReport() }}>
        <strong>{reportSent ? t('Сообщение отправлено', 'Хәбәр җибәрелде') : t('Что не соответствует реальности?', 'Нәрсә чынбарлыкка туры килми?')}</strong>
        {!reportSent && <><textarea autoFocus maxLength={2000} required value={reportText} onChange={(event) => setReportText(event.target.value)} placeholder={t('Опишите неточность…', 'Төгәлсезлекне тасвирлагыз…')} />{reportError && <small>{t('Не удалось отправить. Попробуйте ещё раз.', 'Җибәреп булмады. Кабатлап карагыз.')}</small>}<div><button type="button" onClick={() => setReportSelection(null)}>{t('Выделить заново', 'Яңадан билгеләү')}</button><button type="submit" disabled={reportSending || !reportText.trim()}>{reportSending ? t('Отправляем…', 'Җибәрәбез…') : t('Отправить', 'Җибәрү')}</button></div></>}
      </form>}
    </>}
    {hintPulse > 0 && <div key={hintPulse} className="hint-cost-pulse" aria-hidden="true"><i /><i /><i /><b>−300</b></div>}
    <header className="game-header">
      <button className="brand-button" onClick={onExit} aria-label={t('На главную', 'Баш биткә')}><Brand light /></button>
      <div className="game-header__round">
        <div className="round-chip">{t('Раунд', 'Раунд')} {round.number}<span>/{round.total}</span></div>
        {!revealed && <div className={`round-timer ${secondsLeft <= 10 ? 'is-urgent' : ''}`}>
          <svg className="timer-border" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" width="98" height="34" rx="17" pathLength="100" strokeDasharray={`${timeFraction * 100} 100`} /></svg>
          <Clock3 />{Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:{(secondsLeft % 60).toString().padStart(2, '0')}
        </div>}
      </div>
      <div className="game-header__status">
        <LanguageToggle />
        <div className="audio-control"><button className="audio-toggle" type="button" onClick={onToggleMuted} aria-label={muted ? t('Включить звук', 'Тавышны кабызу') : t('Выключить звук', 'Тавышны сүндерү')}>
          {muted ? <VolumeX /> : <Volume2 />}
        </button><label className="volume-control"><span>{t('Громкость', 'Тавыш дәрәҗәсе')}</span><input style={{ background: `linear-gradient(90deg, rgba(255,255,255,.9) ${Math.round(volume * 100)}%, rgba(255,255,255,.25) ${Math.round(volume * 100)}%)` }} type="range" min="0" max="100" value={Math.round(volume * 100)} aria-label={t('Громкость', 'Тавыш дәрәҗәсе')} onChange={(event) => onVolumeChange(Number(event.target.value) / 100)} /><output>{Math.round(volume * 100)}%</output></label></div>
        <div className="score"><span>{t('Очки', 'Очколар')}</span><strong>{game.score.toLocaleString('ru-RU')}</strong></div>
      </div>
    </header>
    {!revealed && round.eventType === 'legend' && <LegendHint key={round.id} />}
    {!revealed && <div className="guess-dock">
      <YearPicker key={round.id} year={year} onChange={setYear} disabled={busy} legend={round.eventType === 'legend'} />
      <TatarstanMap className="guess-map" selected={selected} onSelect={(point) => { setSelected(point); setMapExpanded(true) }} disabled={busy} expanded={mapExpanded} onExpand={() => setMapExpanded(true)} onLeave={() => { if (!selected) setMapExpanded(false) }} onCollapse={() => setMapExpanded(false)} />
      <button className="answer-button" onClick={() => selected && void onGuess(year, selected, false, usedHintIds)} disabled={!selected || busy || secondsLeft === 0} aria-label={t('Ответить', 'Җавап бирү')}>
        {busy ? <LoaderCircle className="spin" /> : <Check />}<span>{selected ? t('Ответить', 'Җавап бирү') : t('Выберите место', 'Урынны сайлагыз')}</span>
      </button>
    </div>}
    {revealed && <>
      <div className="panorama-tools">
        <button onClick={() => setShowDescription((value) => !value)} aria-pressed={showDescription}><BookOpenText />{t('О событии', 'Вакыйга турында')}</button>
        <button onClick={() => setPanoramaRound(null)}><Map />{t('Карта результата', 'Нәтиҗә картасы')}</button>
        {panoramaTimeline.length > 1 && <button onClick={() => setTimeTravelOpen((value) => !value)} aria-expanded={timeTravelOpen}><History />{t('Другие годы', 'Башка еллар')}</button>}
      </div>
      {timeTravelPresent && <section className={`time-travel-dock ornament-panel ${timeTravelOpen ? '' : 'is-exiting'}`} inert={!timeTravelOpen}>
        <header><div><span>{t('То же место', 'Шул ук урын')}</span><h2>{t('Сквозь время', 'Вакыт аша')}</h2></div><button aria-label={t('Закрыть', 'Ябу')} onClick={() => setTimeTravelOpen(false)}><X /></button></header>
        <div className="time-travel-dock__moments">{panoramaTimeline.map((moment) => <button key={moment.year} className={moment.panoramaUrl === selectedPanoramaUrl ? 'is-selected' : ''} aria-pressed={moment.panoramaUrl === selectedPanoramaUrl} onClick={() => { setSelectedPanoramaUrl(moment.panoramaUrl); setActiveHotspot(null); setTimeTravelOpen(false) }}>
          <strong>{moment.year}</strong><span><b>{localize(moment.title, moment.titleTt)}</b><small>{localize(moment.description, moment.descriptionTt)}</small></span>
        </button>)}</div>
      </section>}
      {descriptionPresent && <aside className={`event-column ornament-panel ${showDescription ? '' : 'is-exiting'}`} inert={!showDescription}>
        <button className="event-column__close" aria-label={t('Скрыть информацию о событии', 'Вакыйга турында мәгълүматны яшерү')} onClick={() => setShowDescription(false)}><X /></button>
        <div className="reveal-panel__story">
          <span className="eyebrow">{formatYear(round.reveal!.year, language)} · {localize(round.reveal!.place, round.reveal!.placeTt)}</span>
          <h1>{localize(round.reveal!.title, round.reveal!.titleTt)}</h1><h2>{localize(round.reveal!.subtitle, round.reveal!.subtitleTt)}</h2>
          <TranslatedDescription key={round.id} description={round.reveal!.description} descriptionTt={round.reveal!.descriptionTt} />
          <a href={round.reveal!.sourceUrl} target="_blank" rel="noreferrer">{t('Источник', 'Чыганак')}: {round.reveal!.sourceTitle} ↗</a>
        </div>
        <div className="event-column__stats">
          <div><span>{t('Расстояние', 'Ара')}</span><strong>{round.result!.distanceKm} <small>км</small></strong></div>
          <div><span>{t('Разница в годах', 'Еллар аермасы')}</span><strong>{round.result!.yearError} <small>{t('лет', 'ел')}</small></strong></div>
          <div><span>{t('Очки', 'Очколар')}</span><strong>+{round.result!.score.toLocaleString('ru-RU')}</strong></div>
        </div>
        <p className="event-column__guess">{t('Ваш год', 'Сезнең ел')}: {formatYear(round.result!.guess.year, language)} · {t('Правильный год', 'Дөрес ел')}: {formatYear(round.reveal!.year, language)}</p>
        {round.result!.timedOut && <p>{t('Время раунда истекло', 'Раунд вакыты бетте')}</p>}
      </aside>}
      <button className="panorama-next primary-button" onClick={onNext} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : round.number === round.total ? <RotateCcw /> : <ArrowRight />}{round.number === round.total ? t('Итоги', 'Нәтиҗәләр') : t('Следующий раунд', 'Киләсе раунд')}</button>
    </>}
  </main>
}
