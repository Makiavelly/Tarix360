package service

import (
	"context"
	"testing"
	"time"

	"github.com/example/tarix360/backend/internal/domain"
	"github.com/example/tarix360/backend/internal/repository/memory"
)

type eventStub struct{ events []domain.Event }

func (s eventStub) List(context.Context) ([]domain.Event, error) { return s.events, nil }
func (s eventStub) Get(_ context.Context, id string) (domain.Event, error) {
	for _, event := range s.events {
		if event.ID == id {
			return event, nil
		}
	}
	return domain.Event{}, domain.ErrNotFound
}

func TestExactGuessGetsMaximumScoreAndReveal(t *testing.T) {
	event := domain.Event{
		ID: "one", Type: domain.EventTypeHistory, Year: 922, Place: "Болгар", Panorama: "one.png",
		Coordinates:        domain.Coordinates{Latitude: 54.9749, Longitude: 49.0303},
		AlternatePanoramas: []domain.AlternatePanorama{{Year: 1870, Title: "Поздний вид", Description: "То же место", Panorama: "later.png"}},
	}
	svc := NewGameService(eventStub{events: []domain.Event{event}}, memory.NewGameRepository())
	game, err := svc.Start(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if game.CurrentRound.Reveal != nil {
		t.Fatal("event timeline was revealed before the guess")
	}

	game, err = svc.Guess(context.Background(), game.ID, game.CurrentRound.ID, domain.Guess{Year: 922, Coordinates: event.Coordinates})
	if err != nil {
		t.Fatal(err)
	}
	if game.Score != maximumRoundScore {
		t.Fatalf("score = %d, want %d", game.Score, maximumRoundScore)
	}
	if game.CurrentRound.Reveal == nil || game.CurrentRound.Reveal.Place != "Болгар" {
		t.Fatal("event was not revealed")
	}
	if len(game.CurrentRound.Reveal.PanoramaTimeline) != 2 {
		t.Fatalf("timeline length = %d, want 2", len(game.CurrentRound.Reveal.PanoramaTimeline))
	}
	if game.CurrentRound.Reveal.PanoramaTimeline[1].PanoramaURL != "/panoramas/later.png?v="+game.CurrentRound.ID {
		t.Fatalf("unexpected alternate panorama URL %q", game.CurrentRound.Reveal.PanoramaTimeline[1].PanoramaURL)
	}
}

func TestNextRequiresGuess(t *testing.T) {
	event := domain.Event{ID: "one", Type: domain.EventTypeHistory, Year: 922, Panorama: "one.png"}
	svc := NewGameService(eventStub{events: []domain.Event{event}}, memory.NewGameRepository())
	game, err := svc.Start(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Next(context.Background(), game.ID); err != domain.ErrGuessRequired {
		t.Fatalf("error = %v", err)
	}
}

func TestGameUsesExactlyThreeUniqueEvents(t *testing.T) {
	events := make([]domain.Event, 5)
	for i := range events {
		events[i] = domain.Event{ID: string(rune('a' + i)), Type: domain.EventTypeHistory, Year: 1000 + i, Panorama: string(rune('a'+i)) + ".png"}
	}
	svc := NewGameService(eventStub{events: events}, memory.NewGameRepository())
	game, err := svc.Start(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if game.CurrentRound.Total != roundsPerGame {
		t.Fatalf("round total = %d, want %d", game.CurrentRound.Total, roundsPerGame)
	}

	seen := make(map[string]struct{}, roundsPerGame)
	for roundNumber := 0; roundNumber < roundsPerGame; roundNumber++ {
		panorama := game.CurrentRound.PanoramaURL
		if _, exists := seen[panorama]; exists {
			t.Fatalf("panorama %q was selected more than once", panorama)
		}
		seen[panorama] = struct{}{}

		game, err = svc.Guess(context.Background(), game.ID, game.CurrentRound.ID, domain.Guess{Year: 1000})
		if err != nil {
			t.Fatal(err)
		}
		game, err = svc.Next(context.Background(), game.ID)
		if err != nil {
			t.Fatal(err)
		}
	}
	if game.Status != string(domain.GameCompleted) {
		t.Fatalf("game status = %q, want %q", game.Status, domain.GameCompleted)
	}
}

func TestTimedOutGuessGetsZeroScore(t *testing.T) {
	event := domain.Event{ID: "one", Type: domain.EventTypeHistory, Year: 922, Panorama: "one.png"}
	games := memory.NewGameRepository()
	svc := NewGameService(eventStub{events: []domain.Event{event}}, games)
	game, err := svc.Start(context.Background())
	if err != nil {
		t.Fatal(err)
	}

	stored, err := games.Get(context.Background(), game.ID)
	if err != nil {
		t.Fatal(err)
	}
	stored.Rounds[stored.CurrentRound].StartedAt = time.Now().Add(-roundDuration - time.Second)
	if err := games.Update(context.Background(), stored); err != nil {
		t.Fatal(err)
	}

	game, err = svc.Guess(context.Background(), game.ID, game.CurrentRound.ID, domain.Guess{Year: 922})
	if err != nil {
		t.Fatal(err)
	}
	if game.CurrentRound.Result.Score != 0 || !game.CurrentRound.Result.TimedOut {
		t.Fatalf("timed out result = %+v", game.CurrentRound.Result)
	}
}
