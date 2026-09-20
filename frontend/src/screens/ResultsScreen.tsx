import { ArrowRight, CalendarDays, MapPin, Trophy } from 'lucide-react'
import type { Game } from '../domain/game'
import { Brand } from '../components/Brand'
import { LanguageToggle } from '../i18n'
import { useLanguage } from '../language'
import { formatYear } from '../domain/years'

export function ResultsScreen({ game, onRestart, onHome }: { game: Game; onRestart: () => void; onHome: () => void }) {
  const { t, localize, language } = useLanguage()
  const percent = Math.round((game.score / game.maximumScore) * 100)
  return (
    <main className="results-screen">
      <header><Brand /><LanguageToggle /><button onClick={onHome}>{t('На главную', 'Баш биткә')}</button></header>
      <section className="results-hero">
        <div className="results-seal"><Trophy /></div>
        <span className="eyebrow">{t('Путешествие завершено', 'Сәяхәт тәмамланды')}</span>
        <h1>{game.score.toLocaleString('ru-RU')}</h1>
        <p>{t('очков из', 'очко /')} {game.maximumScore.toLocaleString('ru-RU')} · {percent}% {t('точности', 'төгәллек')}</p>
        <button className="primary-button" onClick={onRestart}>{t('Играть ещё раз', 'Тагын уйнау')} <ArrowRight /></button>
      </section>
      <section className="results-list">
        <div className="section-heading"><span>{t('Ваш маршрут', 'Сезнең маршрут')}</span></div>
        {game.summary?.map((round) => <article key={round.id}>
          <img src={round.panoramaUrl} alt="" />
          <div><span>{t('Раунд', 'Раунд')} {round.number}</span><h3>{localize(round.reveal?.title, round.reveal?.titleTt)}</h3><p>{round.reveal ? formatYear(round.reveal.year, language) : ''} · {localize(round.reveal?.place, round.reveal?.placeTt)}</p></div>
          <div className="round-errors"><span><CalendarDays /> {round.result?.yearError} {t('лет', 'ел')}</span><span><MapPin /> {round.result?.distanceKm} км</span></div>
          <strong>+{round.result?.score.toLocaleString('ru-RU')}</strong>
        </article>)}
      </section>
    </main>
  )
}

