package filesystem

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
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
		if event.Type != domain.EventTypeHistory && event.Type != domain.EventTypeLegend && event.Type != domain.EventTypeCulture {
			return nil, fmt.Errorf("event %q has invalid type %q", event.ID, event.Type)
		}
		if len(event.Hotspots) != 3 {
			return nil, fmt.Errorf("event %q must contain exactly three hotspots", event.ID)
		}
		hotspotIDs := make(map[string]struct{}, len(event.Hotspots))
		for _, hotspot := range event.Hotspots {
			if hotspot.ID == "" || hotspot.Title == "" || hotspot.Image == "" || hotspot.Description == "" {
				return nil, fmt.Errorf("event %q contains an incomplete hotspot", event.ID)
			}
			if hotspot.Kind != "time" && hotspot.Kind != "place" && hotspot.Kind != "context" && hotspot.Kind != "legend" && hotspot.Kind != "object" && hotspot.Kind != "story" {
				return nil, fmt.Errorf("event %q hotspot %q has invalid kind", event.ID, hotspot.ID)
			}
			if hotspot.Yaw < -math.Pi || hotspot.Yaw > math.Pi || hotspot.Pitch < -math.Pi/2 || hotspot.Pitch > math.Pi/2 {
				return nil, fmt.Errorf("event %q hotspot %q has invalid spherical coordinates", event.ID, hotspot.ID)
			}
			if _, exists := hotspotIDs[hotspot.ID]; exists {
				return nil, fmt.Errorf("event %q contains duplicate hotspot %q", event.ID, hotspot.ID)
			}
			hotspotIDs[hotspot.ID] = struct{}{}
		}
		panoramaYears := map[int]struct{}{event.Year: {}}
		panoramaFiles := map[string]struct{}{event.Panorama: {}}
		for _, panorama := range event.AlternatePanoramas {
			if panorama.Year < -10000 || panorama.Year == 0 || panorama.Title == "" || panorama.Description == "" || panorama.Panorama == "" {
				return nil, fmt.Errorf("event %q contains an incomplete alternate panorama", event.ID)
			}
			if _, exists := panoramaYears[panorama.Year]; exists {
				return nil, fmt.Errorf("event %q contains duplicate panorama year %d", event.ID, panorama.Year)
			}
			if _, exists := panoramaFiles[panorama.Panorama]; exists {
				return nil, fmt.Errorf("event %q contains duplicate panorama file %q", event.ID, panorama.Panorama)
			}
			panoramaYears[panorama.Year] = struct{}{}
			panoramaFiles[panorama.Panorama] = struct{}{}
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
