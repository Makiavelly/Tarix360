export type Coordinates = { lat: number; lng: number }

export type Guess = {
  year: number
  coordinates: Coordinates
}

export type RoundResult = {
  guess: Guess
  yearError: number
  distanceKm: number
  score: number
  maximumScore: number
}

export type EventReveal = {
  title: string
  subtitle: string
  year: number
  place: string
  coordinates: Coordinates
  description: string
  sourceTitle: string
  sourceUrl: string
}

export type Round = {
  id: string
  number: number
  total: number
  panoramaUrl: string
  result?: RoundResult
  reveal?: EventReveal
}

export type Game = {
  id: string
  status: 'in_progress' | 'completed'
  score: number
  maximumScore: number
  currentRound?: Round
  summary?: Round[]
}

