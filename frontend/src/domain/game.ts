export type Coordinates = { lat: number; lng: number }

export type EventType = 'history' | 'legend' | 'culture'

export type Guess = {
  year: number
  coordinates: Coordinates
  timedOut: boolean
}

export type RoundResult = {
  guess: Guess
  yearError: number
  distanceKm: number
  score: number
  maximumScore: number
  timedOut: boolean
}

export type Hotspot = {
  id: string
  title: string
  kind: 'time' | 'place' | 'context' | 'legend' | 'object' | 'story'
  imageUrl: string
  description: string
  yaw: number
  pitch: number
}

export type PanoramaMoment = {
  year: number
  title: string
  description: string
  panoramaUrl: string
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
  hotspots: Hotspot[]
  panoramaTimeline: PanoramaMoment[]
}

export type Round = {
  id: string
  number: number
  total: number
  eventType: EventType
  panoramaUrl: string
  deadline: string
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
