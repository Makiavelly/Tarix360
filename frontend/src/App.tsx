import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, Game } from './domain/game'
import { HttpGameRepository } from './repositories/gameRepository'
import { GameService } from './services/gameService'
import { GameScreen } from './screens/GameScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ResultsScreen } from './screens/ResultsScreen'

export default function App() {
  const service = useMemo(() => new GameService(new HttpGameRepository()), [])
  const [game, setGame] = useState<Game | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [canResume, setCanResume] = useState(Boolean(localStorage.getItem('tarix360.currentGame')))

  useEffect(() => { if (error) { const id = window.setTimeout(() => setError(''), 4500); return () => window.clearTimeout(id) } }, [error])

  async function start() {
    await perform(async () => { const next = await service.start(); setGame(next); setCanResume(true) })
  }

  async function resume() {
    await perform(async () => { const next = await service.resume(); if (next) setGame(next); else setCanResume(false) })
  }

  async function guess(year: number, coordinates: Coordinates) {
    if (!game) return
    await perform(async () => setGame(await service.guess(game, year, coordinates)))
  }

  async function next() {
    if (!game) return
    await perform(async () => { const updated = await service.next(game); setGame(updated); if (updated.status === 'completed') setCanResume(false) })
  }

  async function perform(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Что-то пошло не так') }
    finally { setBusy(false) }
  }

  return (
    <>
      {!game && <HomeScreen loading={busy} canResume={canResume} onStart={start} onResume={resume} />}
      {game?.status === 'in_progress' && <GameScreen game={game} busy={busy} onGuess={guess} onNext={next} onExit={() => setGame(null)} />}
      {game?.status === 'completed' && <ResultsScreen game={game} onRestart={start} onHome={() => setGame(null)} />}
      {error && <div className="error-toast" role="alert">{error}</div>}
    </>
  )
}

