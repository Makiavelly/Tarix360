import { useState } from 'react'
import { LanguageToggle } from '../i18n'
import { useLanguage } from '../language'
import { LobbyDialog } from '../components/LobbyDialog'
import { Brand } from '../components/Brand'
import { TatarstanMap } from '../components/TatarstanMap'

type Props = { loading: boolean; canResume: boolean; onStart: () => void; onResume: () => void }

export function HomeScreen({ loading, canResume, onStart, onResume }: Props) {
  const { t } = useLanguage()
  const [lobbyOpen, setLobbyOpen] = useState(false)
  return (
    <main className="home-screen">
      <header className="home-nav">
        <Brand />
        <nav><LanguageToggle /><a href="#how">{t("Как играть", "Ничек уйнарга")}</a><button onClick={onStart} disabled={loading}>{t("Играть", "Уйнау")}</button></nav>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <span className="kicker">{t("История Татарстана · 360°", "Татарстан тарихы · 360°")}</span>
          <h1>{t("Окажитесь", "Үзегезне")}<br /><em>{t("внутри истории", "тарих эчендә табыгыз")}</em></h1>
          <p>{t("Исследуйте панораму, угадайте место и год — а затем узнайте, что происходило вокруг.", "Панораманы өйрәнегез, урынны һәм елны табыгыз — аннары биредә нәрсә булганын белегез.")}</p>
          <div className="hero__actions">
            <button className="lobby-button" onClick={() => setLobbyOpen(true)}>{t("Создать лобби", "Лобби булдыру")}</button>
            <button className="primary-button" onClick={onStart} disabled={loading}>{loading ? t("Открываем портал…", "Порталны ачабыз…") : t("Начать путешествие", "Сәяхәтне башлау")}</button>
            {canResume && <button className="text-button" onClick={onResume}>{t("Продолжить игру", "Уенны дәвам итү")}</button>}
          </div>
        </div>
        <div className="hero__orb" aria-hidden="true">
          <svg className="hero__arc" viewBox="0 0 500 170"><path id="hero-arc" d="M38 154 A220 220 0 0 1 462 154" fill="none" /><text><textPath href="#hero-arc" startOffset="50%">Кайда? · Кайчан? · Где? · Когда?</textPath></text></svg>
          <div className="hero__globe"><TatarstanMap hero /></div>
        </div>
      </section>

      <section className="steps" id="how">
        <div className="section-heading"><span>{t("Три шага", "Өч адым")}</span><h2>{t("Как играть", "Ничек уйнарга")}</h2></div>
        <div className="steps__grid">
          <article><span>01</span><h3>{t("Осмотритесь", "Тирә-якка карагыз")}</h3><p>{t("Вращайте 360°-сцену и замечайте исторические детали.", "360° күренешне әйләндерегез һәм тарихи детальләрне күзәтегез.")}</p></article>
          <article><span>02</span><h3>{t("Сделайте догадку", "Фаразлагыз")}</h3><p>{t("Поставьте метку на карте Татарстана и выберите год.", "Татарстан картасында билге куегыз һәм елны сайлагыз.")}</p></article>
          <article><span>03</span><h3>{t("Откройте историю", "Тарихны ачыгыз")}</h3><p>{t("Сравните ответ с фактом и прочитайте рассказ о событии.", "Җавабыгызны дөрес җавап белән чагыштырыгыз һәм вакыйга турында укыгыз.")}</p></article>
        </div>
      </section>

      <footer><Brand /><p>{t("Экспериментальный образовательный проект о Татарстане", "Татарстан турында тәҗрибәви белем бирү проекты")}</p><button onClick={onStart}>{t("Начать игру", "Уенны башлау")}</button></footer>
      {lobbyOpen && <LobbyDialog onClose={() => setLobbyOpen(false)} />}
    </main>
  )
}
