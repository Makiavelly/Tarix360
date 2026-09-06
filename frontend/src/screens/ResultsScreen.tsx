import { ArrowRight, CalendarDays, MapPin, Trophy } from 'lucide-react'
import type { Game } from '../domain/game'
import { Brand } from '../components/Brand'

export function ResultsScreen({ game, onRestart, onHome }: { game: Game; onRestart: () => void; onHome: () => void }) {
  const percent = Math.round((game.score / game.maximumScore) * 100)
  return (
    <main className="results-screen">
      <header><Brand /><button onClick={onHome}>На главную</button></header>
      <section className="results-hero">
        <div className="results-seal"><Trophy /></div>
        <span className="eyebrow">Путешествие завершено</span>
        <h1>{game.score.toLocaleString('ru-RU')}</h1>
        <p>очков из {game.maximumScore.toLocaleString('ru-RU')} · {percent}% точности</p>
        <button className="primary-button" onClick={onRestart}>Играть ещё раз <ArrowRight /></button>
      </section>
      <section className="results-list">
        <div className="section-heading"><span>Ваш маршрут</span><h2>Три главы истории</h2></div>
        {game.summary?.map((round) => <article key={round.id}>
          <img src={round.panoramaUrl} alt="" />
          <div><span>Раунд {round.number}</span><h3>{round.reveal?.title}</h3><p>{round.reveal?.year} · {round.reveal?.place}</p></div>
          <div className="round-errors"><span><CalendarDays /> {round.result?.yearError} лет</span><span><MapPin /> {round.result?.distanceKm} км</span></div>
          <strong>+{round.result?.score.toLocaleString('ru-RU')}</strong>
        </article>)}
      </section>
    </main>
  )
}

