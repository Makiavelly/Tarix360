import { ArrowDown, Compass, Landmark, MapPinned, Move3d } from 'lucide-react'
import { Brand } from '../components/Brand'
import { TatarstanMap } from '../components/TatarstanMap'

type Props = { loading: boolean; canResume: boolean; onStart: () => void; onResume: () => void }

const previews = [
  { image: '/panoramas/bolgar-922.png', range: '922 год', title: 'Волжская Булгария' },
  { image: '/panoramas/founding-kazan-1005.png', range: 'около 1005 года', title: 'Рождение Казани' },
  { image: '/panoramas/kremlin.png?v=20260919', range: '1552 год', title: 'Казанское ханство' },
]

export function HomeScreen({ loading, canResume, onStart, onResume }: Props) {
  return (
    <main className="home-screen">
      <header className="home-nav">
        <Brand />
        <nav><a href="#how">Как играть</a><a href="#archive">Архив</a><button onClick={onStart} disabled={loading}>Играть</button></nav>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <span className="kicker">История Татарстана · 360°</span>
          <h1>Окажитесь<br /><em>внутри истории</em></h1>
          <p>Исследуйте панораму, угадайте место и год — а затем узнайте, что происходило вокруг.</p>
          <div className="hero__actions">
            <button className="primary-button" onClick={onStart} disabled={loading}>{loading ? 'Открываем портал…' : 'Начать путешествие'}</button>
            {canResume && <button className="text-button" onClick={onResume}>Продолжить игру</button>}
          </div>
        </div>
        <div className="hero__orb" aria-hidden="true">
          <svg className="hero__arc" viewBox="0 0 500 170"><path id="hero-arc" d="M38 154 A220 220 0 0 1 462 154" fill="none" /><text><textPath href="#hero-arc" startOffset="50%">Кайда? · Кайчан? · Где? · Когда?</textPath></text></svg>
          <div className="hero__globe"><TatarstanMap hero /></div>
        </div>
        <a className="hero__down" href="#how" aria-label="Перейти к правилам"><ArrowDown /></a>
      </section>

      <section className="steps" id="how">
        <div className="section-heading"><span>Три шага</span><h2>Как играть</h2></div>
        <div className="steps__grid">
          <article><Move3d /><span>01</span><h3>Осмотритесь</h3><p>Вращайте 360°-сцену и замечайте исторические детали.</p></article>
          <article><MapPinned /><span>02</span><h3>Сделайте догадку</h3><p>Поставьте метку на карте Татарстана и выберите год.</p></article>
          <article><Landmark /><span>03</span><h3>Откройте историю</h3><p>Сравните ответ с фактом и прочитайте рассказ о событии.</p></article>
        </div>
      </section>

      <section className="archive" id="archive">
        <div className="section-heading section-heading--row"><div><span>Три эпохи</span><h2>Панорамы времени</h2></div><Compass /></div>
        <div className="archive__grid">
          {previews.map((item) => <article key={item.title} style={{ backgroundImage: `url(${item.image})` }}><span>{item.range}</span><h3>{item.title}</h3></article>)}
        </div>
      </section>

      <footer><Brand /><p>Экспериментальный образовательный проект о Татарстане</p><button onClick={onStart}>Начать игру →</button></footer>
    </main>
  )
}
