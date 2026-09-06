package memory

import (
	"context"
	"sync"

	"github.com/example/tarix360/backend/internal/domain"
)

type GameRepository struct {
	mu    sync.RWMutex
	games map[string]domain.Game
}

func NewGameRepository() *GameRepository {
	return &GameRepository{games: make(map[string]domain.Game)}
}

func (r *GameRepository) Create(_ context.Context, game domain.Game) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.games[game.ID] = cloneGame(game)
	return nil
}

func (r *GameRepository) Get(_ context.Context, id string) (domain.Game, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	game, ok := r.games[id]
	if !ok {
		return domain.Game{}, domain.ErrNotFound
	}
	return cloneGame(game), nil
}

func (r *GameRepository) Update(_ context.Context, game domain.Game) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.games[game.ID]; !ok {
		return domain.ErrNotFound
	}
	r.games[game.ID] = cloneGame(game)
	return nil
}

func cloneGame(game domain.Game) domain.Game {
	clone := game
	clone.Rounds = append([]domain.Round(nil), game.Rounds...)
	for i := range clone.Rounds {
		if game.Rounds[i].Result != nil {
			result := *game.Rounds[i].Result
			clone.Rounds[i].Result = &result
		}
	}
	return clone
}
