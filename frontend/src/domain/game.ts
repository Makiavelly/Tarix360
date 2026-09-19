export type Coordinates = { lat: number; lng: number }

export type EventType = 'history' | 'legend' | 'culture'

export type Guess = {
  year: number
  coordinates: Coordinates
  timedOut: boolean
  hintIds?: string[]
}

export type RoundResult = {
  guess: Guess
  yearError: number
  distanceKm: number
  score: number
  maximumScore: number
  timedOut: boolean
  hintPenalty: number
}

export type Hotspot = {
  id: string
  title: string
  titleTt?: string
  kind: 'time' | 'place' | 'context' | 'legend' | 'object' | 'story'
  imageUrl: string
  imageSourceUrl?: string
  imageCredit?: string
  description: string
  descriptionTt?: string
  yaw: number
  pitch: number
}

export type PanoramaMoment = {
  year: number
  title: string
  titleTt?: string
  description: string
  descriptionTt?: string
  panoramaUrl: string
}

export type EventReveal = {
  title: string
  titleTt?: string
  subtitle: string
  subtitleTt?: string
  year: number
  place: string
  placeTt?: string
  coordinates: Coordinates
  description: string
  descriptionTt?: string
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
  hotspots?: Hotspot[]
}

export type Game = {
  id: string
  status: 'in_progress' | 'completed'
  score: number
  maximumScore: number
  currentRound?: Round
  summary?: Round[]
}
