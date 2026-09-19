package service

import (
	"context"
	"testing"

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
