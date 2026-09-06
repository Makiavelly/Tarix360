package filesystem

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/example/tarix360/backend/internal/domain"
)

type EventRepository struct {
	events []domain.Event
	byID   map[string]domain.Event
}

func NewEventRepository(path string) (*EventRepository, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read event catalog: %w", err)
	}

	var events []domain.Event
	if err := json.Unmarshal(data, &events); err != nil {
		return nil, fmt.Errorf("decode event catalog: %w", err)
	}
	if len(events) == 0 {
		return nil, fmt.Errorf("event catalog is empty")
	}

	byID := make(map[string]domain.Event, len(events))
	for _, event := range events {
		if event.ID == "" || event.Panorama == "" {
			return nil, fmt.Errorf("event id and panorama are required")
		}
		if _, exists := byID[event.ID]; exists {
			return nil, fmt.Errorf("duplicate event id %q", event.ID)
		}
		byID[event.ID] = event
	}

	return &EventRepository{events: events, byID: byID}, nil
}

func (r *EventRepository) List(context.Context) ([]domain.Event, error) {
	return append([]domain.Event(nil), r.events...), nil
}

func (r *EventRepository) Get(_ context.Context, id string) (domain.Event, error) {
	event, ok := r.byID[id]
	if !ok {
		return domain.Event{}, domain.ErrNotFound
	}
	return event, nil
}
