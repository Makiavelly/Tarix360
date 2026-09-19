import { useLanguage } from './language'
import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, Game } from './domain/game'
import { HttpGameRepository } from './repositories/gameRepository'
import { GameService } from './services/gameService'
import { GameAudioService } from './services/gameAudioService'
import { GameScreen } from './screens/GameScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { JourneyLoader } from './components/JourneyLoader'

export default function App() {
  const { t } = useLanguage()
  const service = useMemo(() => new GameService(new HttpGameRepository()), [])
  const audio = useMemo(() => new GameAudioService(), [])
  const [game, setGame] = useState<Game | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [canResume, setCanResume] = useState(Boolean(localStorage.getItem('tarix360.currentGame')))
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('tarix360.volume')
    const value = stored === null ? .7 : Number(stored)
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : .7
  })
  useEffect(() => { audio.setVolume(volume); localStorage.setItem('tarix360.volume', String(volume)) }, [audio, volume])

  const currentEventType = game?.status === 'in_progress' ? game.currentRound?.eventType : undefined

  useEffect(() => { if (error) { const id = window.setTimeout(() => setError(''), 4500); return () => window.clearTimeout(id) } }, [error])
  useEffect(() => {
    if (currentEventType) audio.setTheme(currentEventType)
    else audio.stop()
  }, [audio, currentEventType])
  useEffect(() => () => audio.destroy(), [audio])

  async function start() {
    audio.activate()
    await perform(async () => { const next = await service.start(); setGame(next); setCanResume(true) })
  }

  async function resume() {
    audio.activate()
    await perform(async () => { const next = await service.resume(); if (next) setGame(next); else setCanResume(false) })
  }

  async function guess(year: number, coordinates: Coordinates, timedOut = false, hintIds: string[] = []) {
    if (!game) return
    await perform(async () => {
      const updated = await service.guess(game, year, coordinates, timedOut, hintIds)
      setGame(updated)
      if (!updated.currentRound?.result?.timedOut) audio.playRevealEffect()
    })
  }

  async function next() {
    if (!game) return
    await perform(async () => { const updated = await service.next(game); setGame(updated); if (updated.status === 'completed') setCanResume(false) })
  }

  async function perform(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action() } catch (caught) { setError(caught instanceof Error ? caught.message : t('Что-то пошло не так', 'Хата килеп чыкты')) }
    finally { setBusy(false) }
  }

  return (
    <>
      {!game && <HomeScreen loading={busy} canResume={canResume} onStart={start} onResume={resume} />}
      {game?.status === 'in_progress' && <GameScreen
        game={game}
        busy={busy}
        muted={muted}
        volume={volume}
        onVolumeChange={setVolume}
        onTimeExpired={() => audio.playTimeUp()}
        onTimeWarning={(seconds) => audio.playTimeWarning(seconds)}
        onHintUsed={() => audio.playHintUsed()}
        onGuess={guess}
        onNext={next}
        onToggleMuted={() => setMuted((value) => {
          audio.setMuted(!value)
          return !value
        })}
        onExit={() => { audio.stop(); setGame(null) }}
      />}
      {game?.status === 'completed' && <ResultsScreen game={game} onRestart={start} onHome={() => setGame(null)} />}
      {error && <div className="error-toast" role="alert">{error}</div>}
      {busy && <JourneyLoader compact />}
    </>
  )
}
