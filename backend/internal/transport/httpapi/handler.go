package httpapi

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/example/tarix360/backend/internal/domain"
	"github.com/example/tarix360/backend/internal/service"
)

type Handler struct {
	games  *service.GameService
	logger *log.Logger
}

func NewHandler(games *service.GameService, panoramaDir string, logger *log.Logger) http.Handler {
	h := &Handler{games: games, logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", h.health)
	mux.HandleFunc("POST /api/v1/games", h.startGame)
	mux.HandleFunc("GET /api/v1/games/{gameID}", h.getGame)
	mux.HandleFunc("POST /api/v1/games/{gameID}/rounds/{roundID}/guess", h.guess)
	mux.HandleFunc("POST /api/v1/games/{gameID}/next", h.next)
	mux.Handle("GET /panoramas/", http.StripPrefix("/panoramas/", http.FileServer(http.Dir(panoramaDir))))
	return h.middleware(mux)
}

func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) startGame(w http.ResponseWriter, r *http.Request) {
	game, err := h.games.Start(r.Context())
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, game)
}

func (h *Handler) getGame(w http.ResponseWriter, r *http.Request) {
	game, err := h.games.Get(r.Context(), r.PathValue("gameID"))
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, game)
}

func (h *Handler) guess(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Year     int     `json:"year"`
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
		TimedOut bool    `json:"timedOut"`
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	game, err := h.games.Guess(r.Context(), r.PathValue("gameID"), r.PathValue("roundID"), domain.Guess{
		Year: request.Year, Coordinates: domain.Coordinates{Latitude: request.Lat, Longitude: request.Lng}, TimedOut: request.TimedOut,
	})
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, game)
}

func (h *Handler) next(w http.ResponseWriter, r *http.Request) {
	game, err := h.games.Next(r.Context(), r.PathValue("gameID"))
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, game)
}

func (h *Handler) writeError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	message := "internal server error"
	switch {
	case errors.Is(err, domain.ErrNotFound):
		status, message = http.StatusNotFound, "game or round not found"
	case errors.Is(err, domain.ErrInvalidGuess), errors.Is(err, domain.ErrGuessRequired), errors.Is(err, domain.ErrRoundCompleted), errors.Is(err, domain.ErrGameCompleted):
		status, message = http.StatusConflict, err.Error()
	default:
		h.logger.Printf("request failed: %v", err)
	}
	writeJSON(w, status, map[string]string{"error": message})
}

func (h *Handler) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
		}
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
