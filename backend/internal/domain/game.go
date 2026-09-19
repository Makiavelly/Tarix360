package domain

import (
	"errors"
	"time"
)

var (
	ErrNotFound       = errors.New("not found")
	ErrInvalidGuess   = errors.New("invalid guess")
	ErrRoundCompleted = errors.New("round already completed")
	ErrGuessRequired  = errors.New("submit a guess before continuing")
	ErrGameCompleted  = errors.New("game already completed")
)

type GameStatus string

const (
	GameInProgress GameStatus = "in_progress"
	GameCompleted  GameStatus = "completed"
)

type Guess struct {
	Year        int         `json:"year"`
	Coordinates Coordinates `json:"coordinates"`
	TimedOut    bool        `json:"timedOut"`
}

type RoundResult struct {
	Guess        Guess `json:"guess"`
	YearError    int   `json:"yearError"`
	DistanceKM   int   `json:"distanceKm"`
	Score        int   `json:"score"`
	MaximumScore int   `json:"maximumScore"`
	TimedOut     bool  `json:"timedOut"`
}

type Round struct {
	ID        string       `json:"id"`
	EventID   string       `json:"eventId"`
	Result    *RoundResult `json:"result,omitempty"`
	StartedAt time.Time    `json:"startedAt"`
}

type Game struct {
	ID           string     `json:"id"`
	Rounds       []Round    `json:"rounds"`
	CurrentRound int        `json:"currentRound"`
	Score        int        `json:"score"`
	Status       GameStatus `json:"status"`
	CreatedAt    time.Time  `json:"createdAt"`
}
