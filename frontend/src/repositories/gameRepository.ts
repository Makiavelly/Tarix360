import type { Coordinates, Game } from '../domain/game'

export interface GameRepository {
  start(): Promise<Game>
  get(gameId: string): Promise<Game>
  guess(gameId: string, roundId: string, year: number, coordinates: Coordinates, timedOut?: boolean): Promise<Game>
  next(gameId: string): Promise<Game>
}

export class HttpGameRepository implements GameRepository {
  constructor(private readonly baseUrl = '/api/v1') {}

  start(): Promise<Game> {
    return this.request('/games', { method: 'POST' })
  }

  get(gameId: string): Promise<Game> {
    return this.request(`/games/${gameId}`)
  }

  guess(gameId: string, roundId: string, year: number, coordinates: Coordinates, timedOut = false): Promise<Game> {
    return this.request(`/games/${gameId}/rounds/${roundId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, lat: coordinates.lat, lng: coordinates.lng, timedOut }),
    })
  }

  next(gameId: string): Promise<Game> {
    return this.request(`/games/${gameId}/next`, { method: 'POST' })
  }

  private async request(path: string, init?: RequestInit): Promise<Game> {
    const response = await fetch(`${this.baseUrl}${path}`, init)
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? 'Сервер не ответил. Попробуйте ещё раз.')
    }
    return response.json() as Promise<Game>
  }
}
