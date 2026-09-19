package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"math"
	mathrand "math/rand/v2"
	"sort"
	"time"

	"github.com/example/tarix360/backend/internal/domain"
)

const maximumRoundScore = 5000

type PublicRound struct {
	ID          string              `json:"id"`
	Number      int                 `json:"number"`
	Total       int                 `json:"total"`
	EventType   domain.EventType    `json:"eventType"`
	PanoramaURL string              `json:"panoramaUrl"`
	Result      *domain.RoundResult `json:"result,omitempty"`
	Reveal      *EventReveal        `json:"reveal,omitempty"`
}

type EventReveal struct {
	Title            string             `json:"title"`
	Subtitle         string             `json:"subtitle"`
	Year             int                `json:"year"`
	Place            string             `json:"place"`
	Coordinates      domain.Coordinates `json:"coordinates"`
	Description      string             `json:"description"`
	SourceTitle      string             `json:"sourceTitle"`
	SourceURL        string             `json:"sourceUrl"`
	Hotspots         []domain.Hotspot   `json:"hotspots"`
	PanoramaTimeline []PanoramaMoment   `json:"panoramaTimeline"`
}

type PanoramaMoment struct {
	Year        int    `json:"year"`
	Title       string `json:"title"`
	Description string `json:"description"`
	PanoramaURL string `json:"panoramaUrl"`
}

type GameView struct {
	ID           string        `json:"id"`
	Status       string        `json:"status"`
	Score        int           `json:"score"`
	MaximumScore int           `json:"maximumScore"`
	CurrentRound *PublicRound  `json:"currentRound,omitempty"`
	Summary      []PublicRound `json:"summary,omitempty"`
}

type GameService struct {
	events domain.EventRepository
	games  domain.GameRepository
}

func NewGameService(events domain.EventRepository, games domain.GameRepository) *GameService {
	return &GameService{events: events, games: games}
}

func (s *GameService) Start(ctx context.Context) (GameView, error) {
	events, err := s.events.List(ctx)
	if err != nil {
		return GameView{}, err
	}
	mathrand.Shuffle(len(events), func(i, j int) { events[i], events[j] = events[j], events[i] })

	game := domain.Game{
		ID:        randomID(),
		Status:    domain.GameInProgress,
		CreatedAt: time.Now().UTC(),
		Rounds:    make([]domain.Round, len(events)),
	}
	for i, event := range events {
		game.Rounds[i] = domain.Round{ID: randomID(), EventID: event.ID}
	}
	if err := s.games.Create(ctx, game); err != nil {
		return GameView{}, err
	}
	return s.view(ctx, game)
}

func (s *GameService) Get(ctx context.Context, gameID string) (GameView, error) {
	game, err := s.games.Get(ctx, gameID)
	if err != nil {
		return GameView{}, err
	}
	return s.view(ctx, game)
}

func (s *GameService) Guess(ctx context.Context, gameID, roundID string, guess domain.Guess) (GameView, error) {
	if guess.Year < 500 || guess.Year > time.Now().Year() || guess.Coordinates.Latitude < -90 || guess.Coordinates.Latitude > 90 || guess.Coordinates.Longitude < -180 || guess.Coordinates.Longitude > 180 {
		return GameView{}, domain.ErrInvalidGuess
	}

	game, err := s.games.Get(ctx, gameID)
	if err != nil {
		return GameView{}, err
	}
	if game.Status == domain.GameCompleted {
		return GameView{}, domain.ErrGameCompleted
	}
	round := &game.Rounds[game.CurrentRound]
	if round.ID != roundID {
		return GameView{}, domain.ErrNotFound
	}
	if round.Result != nil {
		return GameView{}, domain.ErrRoundCompleted
	}

	event, err := s.events.Get(ctx, round.EventID)
	if err != nil {
		return GameView{}, err
	}
	distance := haversineKM(guess.Coordinates, event.Coordinates)
	yearError := abs(guess.Year - event.Year)
	roundScore := score(distance, yearError)
	round.Result = &domain.RoundResult{
		Guess: guess, YearError: yearError, DistanceKM: int(math.Round(distance)),
		Score: roundScore, MaximumScore: maximumRoundScore,
	}
	game.Score += roundScore
	if err := s.games.Update(ctx, game); err != nil {
		return GameView{}, err
	}
	return s.view(ctx, game)
}

func (s *GameService) Next(ctx context.Context, gameID string) (GameView, error) {
	game, err := s.games.Get(ctx, gameID)
	if err != nil {
		return GameView{}, err
	}
	if game.Status == domain.GameCompleted {
		return GameView{}, domain.ErrGameCompleted
	}
	if game.Rounds[game.CurrentRound].Result == nil {
		return GameView{}, domain.ErrGuessRequired
	}

	if game.CurrentRound == len(game.Rounds)-1 {
		game.Status = domain.GameCompleted
	} else {
		game.CurrentRound++
	}
	if err := s.games.Update(ctx, game); err != nil {
		return GameView{}, err
	}
	return s.view(ctx, game)
}

func (s *GameService) view(ctx context.Context, game domain.Game) (GameView, error) {
	view := GameView{ID: game.ID, Status: string(game.Status), Score: game.Score, MaximumScore: len(game.Rounds) * maximumRoundScore}
	if game.Status == domain.GameCompleted {
		view.Summary = make([]PublicRound, 0, len(game.Rounds))
		for i, round := range game.Rounds {
			publicRound, err := s.publicRound(ctx, round, i+1, len(game.Rounds))
			if err != nil {
				return GameView{}, err
			}
			view.Summary = append(view.Summary, publicRound)
		}
		return view, nil
	}

	publicRound, err := s.publicRound(ctx, game.Rounds[game.CurrentRound], game.CurrentRound+1, len(game.Rounds))
	if err != nil {
		return GameView{}, err
	}
	view.CurrentRound = &publicRound
	return view, nil
}

func (s *GameService) publicRound(ctx context.Context, round domain.Round, number, total int) (PublicRound, error) {
	event, err := s.events.Get(ctx, round.EventID)
	if err != nil {
		return PublicRound{}, err
	}
	result := PublicRound{
		ID: round.ID, Number: number, Total: total, EventType: event.Type,
		PanoramaURL: "/panoramas/" + event.Panorama + "?v=" + round.ID,
		Result:      round.Result,
	}
	if round.Result != nil {
		panoramaTimeline := make([]PanoramaMoment, 0, len(event.AlternatePanoramas)+1)
		panoramaTimeline = append(panoramaTimeline, PanoramaMoment{
			Year: event.Year, Title: event.Title, Description: event.Subtitle, PanoramaURL: result.PanoramaURL,
		})
		for _, panorama := range event.AlternatePanoramas {
			panoramaTimeline = append(panoramaTimeline, PanoramaMoment{
				Year: panorama.Year, Title: panorama.Title, Description: panorama.Description,
				PanoramaURL: "/panoramas/" + panorama.Panorama + "?v=" + round.ID,
			})
		}
		result.Reveal = &EventReveal{
			Title: event.Title, Subtitle: event.Subtitle, Year: event.Year, Place: event.Place,
			Coordinates: event.Coordinates, Description: event.Description,
			SourceTitle: event.SourceTitle, SourceURL: event.SourceURL,
			Hotspots: append([]domain.Hotspot(nil), event.Hotspots...), PanoramaTimeline: panoramaTimeline,
		}
	}
	return result, nil
}

func score(distance float64, yearError int) int {
	placeScore := 3000 * math.Exp(-distance/120)
	timeScore := 2000 * math.Exp(-float64(yearError)/160)
	value := int(math.Round(placeScore + timeScore))
	return min(max(value, 0), maximumRoundScore)
}

func haversineKM(a, b domain.Coordinates) float64 {
	const earthRadiusKM = 6371
	lat1, lat2 := radians(a.Latitude), radians(b.Latitude)
	dLat := radians(b.Latitude - a.Latitude)
	dLon := radians(b.Longitude - a.Longitude)
	h := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1)*math.Cos(lat2)*math.Sin(dLon/2)*math.Sin(dLon/2)
	return earthRadiusKM * 2 * math.Atan2(math.Sqrt(h), math.Sqrt(1-h))
}

func radians(degrees float64) float64 { return degrees * math.Pi / 180 }
func abs(value int) int {
	if value < 0 {
		return -value
	}
	return value
}

func randomID() string {
	var value [12]byte
	if _, err := rand.Read(value[:]); err == nil {
		return hex.EncodeToString(value[:])
	}
	return time.Now().UTC().Format("20060102150405.000000000")
}

// StableSummaryOrder is exposed for clients that want a chronological archive.
func StableSummaryOrder(events []domain.Event) {
	sort.SliceStable(events, func(i, j int) bool { return events[i].Year < events[j].Year })
}
