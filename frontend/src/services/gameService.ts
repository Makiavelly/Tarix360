import type { Coordinates, Game } from '../domain/game'
import type { GameRepository } from '../repositories/gameRepository'

const storageKey = 'tarix360.currentGame'

export class GameService {
  constructor(private readonly repository: GameRepository) {}

  async start(): Promise<Game> {
    const game = await this.repository.start()
    localStorage.setItem(storageKey, game.id)
    return game
  }

  async resume(): Promise<Game | null> {
    const gameId = localStorage.getItem(storageKey)
    if (!gameId) return null
    try {
      return await this.repository.get(gameId)
    } catch {
      localStorage.removeItem(storageKey)
      return null
    }
  }

  guess(game: Game, year: number, coordinates: Coordinates, timedOut = false): Promise<Game> {
    if (!game.currentRound) throw new Error('Раунд не найден')
    return this.repository.guess(game.id, game.currentRound.id, year, coordinates, timedOut)
  }

  async next(game: Game): Promise<Game> {
    const updated = await this.repository.next(game.id)
    if (updated.status === 'completed') localStorage.removeItem(storageKey)
    return updated
  }
}
