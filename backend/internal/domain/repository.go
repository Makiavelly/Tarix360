package domain

import "context"

type EventRepository interface {
	List(context.Context) ([]Event, error)
	Get(context.Context, string) (Event, error)
}

type GameRepository interface {
	Create(context.Context, Game) error
	Get(context.Context, string) (Game, error)
	Update(context.Context, Game) error
}
