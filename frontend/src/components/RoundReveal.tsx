import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Round } from '../domain/game'
import { LanguageToggle } from '../i18n'
import { useLanguage } from '../language'
import { TatarstanMap } from './TatarstanMap'
import { formatYear } from '../domain/years'
import { Brand } from './Brand'

export function RoundReveal({ round, onContinue, onExit }: { round: Round; onContinue: () => void; onExit: () => void }) {
  const { t, localize, language } = useLanguage()
  const result = round.result!
  const reveal = round.reveal!
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [mapMoving, setMapMoving] = useState(false)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const continueRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setProgress(1); setReady(true); return }
    let frame = 0
    const start = performance.now() + 650
    const tick = (now: number) => {
      const value = Math.max(0, Math.min(1, (now - start) / 2100))
      setProgress(1 - Math.pow(1 - value, 3))
      if (value < 1) frame = requestAnimationFrame(tick)
      else setReady(true)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); if (settleTimerRef.current) clearTimeout(settleTimerRef.current) }
  }, [])

  const count = (value: number) => Math.round(value * progress).toLocaleString('ru-RU')
  return <main className={`round-reveal ${ready ? 'is-ready' : ''}`}>
    <TatarstanMap className="round-reveal__map" selected={result.guess.coordinates} answer={reveal.coordinates} disabled animateReveal onInteractionChange={(active) => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
      if (active) setMapMoving(true)
      else settleTimerRef.current = setTimeout(() => setMapMoving(false), 550)
    }} />
    <header className="round-reveal__header">
      <button className="brand-button" onClick={onExit} aria-label={t('На главную', 'Баш биткә')}><Brand /></button>
      <span>{t('Результат раунда', 'Раунд нәтиҗәсе')} {round.number} / {round.total}</span>
      <LanguageToggle />
    </header>
    <div className={`round-reveal__place ${mapMoving ? 'is-hidden' : ''}`}><span>{t('Вот где это было', 'Бу вакыйга шушында булган')}</span><h1>{localize(reveal.place, reveal.placeTt)}</h1><p>{formatYear(reveal.year, language)} · {localize(reveal.title, reveal.titleTt)}</p></div>
    <div className="round-reveal__legend"><span className="guess-dot" />{t('Ваш ответ', 'Сезнең җавап')}<span className="answer-dot" />{t('Правильное место', 'Дөрес урын')}</div>
    {result.timedOut && <p className="round-reveal__timeout">{t('Время вышло — показан последний выбранный ответ', 'Вакыт бетте — соңгы сайланган җавап күрсәтелә')}</p>}
    <section className="round-reveal__bottom" aria-label={t('Результаты', 'Нәтиҗәләр')}>
      <div className="round-reveal__metrics" aria-hidden="true">
        <div className="reveal-stat"><span>{t('До правильной метки', 'Дөрес билгегә кадәр')}</span><strong>{count(result.distanceKm)} <small>{t('км', 'км')}</small></strong></div>
        <div className="reveal-stat"><span>{t('Разница в годах', 'Еллар аермасы')}</span><strong>{count(result.yearError)} <small>{t('лет', 'ел')}</small></strong></div>
        <div className="reveal-stat reveal-stat--score"><span>{t('Очки за раунд', 'Раунд өчен очколар')}</span><strong>+{count(result.score)}</strong><small>{result.hintPenalty > 0 ? t(`Подсказки: −${result.hintPenalty}`, `Ишарәләр: −${result.hintPenalty}`) : `${t('из', 'мөмкин булган')} ${result.maximumScore.toLocaleString('ru-RU')}`}</small></div>
      </div>
      <p className="sr-only" role="status">{ready ? `${t('Расстояние', 'Ара')}: ${result.distanceKm} км. ${t('Разница в годах', 'Еллар аермасы')}: ${result.yearError}. ${t('Очки', 'Очколар')}: ${result.score}.` : t('Подсчитываем результат', 'Нәтиҗәне исәплибез')}</p>
      <button ref={continueRef} className="primary-button round-reveal__continue" disabled={!ready} onClick={onContinue}>{t('На панораму', 'Панорамага')}<ArrowRight /></button>
    </section>
  </main>
}
