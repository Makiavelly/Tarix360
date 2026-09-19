package httpapi

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/example/tarix360/backend/internal/domain"
	"github.com/example/tarix360/backend/internal/service"
)

type Handler struct {
	games      *service.GameService
	logger     *log.Logger
	reportFile string
	reportMu   sync.Mutex
}

func NewHandler(games *service.GameService, panoramaDir string, logger *log.Logger) http.Handler {
	h := &Handler{games: games, logger: logger, reportFile: filepath.Join(filepath.Dir(panoramaDir), "reports.jsonl")}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", h.health)
	mux.HandleFunc("POST /api/v1/games", h.startGame)
	mux.HandleFunc("GET /api/v1/games/{gameID}", h.getGame)
	mux.HandleFunc("POST /api/v1/games/{gameID}/rounds/{roundID}/guess", h.guess)
	mux.HandleFunc("POST /api/v1/games/{gameID}/next", h.next)
	mux.HandleFunc("POST /api/v1/reports", h.createReport)
	mux.Handle("GET /panoramas/", http.StripPrefix("/panoramas/", http.FileServer(http.Dir(panoramaDir))))
	return h.middleware(mux)
}

func (h *Handler) createReport(w http.ResponseWriter, r *http.Request) {
	var report struct {
		GameID      string  `json:"gameId"`
		RoundID     string  `json:"roundId"`
		PanoramaURL string  `json:"panoramaUrl"`
		Description string  `json:"description"`
		X           float64 `json:"x"`
		Y           float64 `json:"y"`
		Width       float64 `json:"width"`
		Height      float64 `json:"height"`
		Yaw         float64 `json:"yaw"`
		Pitch       float64 `json:"pitch"`
		CreatedAt   string  `json:"createdAt"`
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&report); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	report.Description = strings.TrimSpace(report.Description)
	if report.GameID == "" || report.RoundID == "" || report.PanoramaURL == "" || report.Description == "" || len([]rune(report.Description)) > 2000 || report.X < 0 || report.Y < 0 || report.Width <= 0 || report.Height <= 0 || report.X+report.Width > 1.001 || report.Y+report.Height > 1.001 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid report"})
		return
	}
	report.CreatedAt = time.Now().UTC().Format(time.RFC3339Nano)
	line, err := json.Marshal(report)
	if err != nil {
		h.writeError(w, err)
		return
	}
	h.reportMu.Lock()
	err = os.MkdirAll(filepath.Dir(h.reportFile), 0755)
	if err == nil {
		var file *os.File
		file, err = os.OpenFile(h.reportFile, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
		if err == nil {
			_, err = file.Write(append(line, '\n'))
			closeErr := file.Close()
			if err == nil {
				err = closeErr
			}
		}
	}
	h.reportMu.Unlock()
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"status": "accepted"})
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
		Year     int      `json:"year"`
		Lat      float64  `json:"lat"`
		Lng      float64  `json:"lng"`
		TimedOut bool     `json:"timedOut"`
		HintIDs  []string `json:"hintIds"`
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	game, err := h.games.Guess(r.Context(), r.PathValue("gameID"), r.PathValue("roundID"), domain.Guess{
		Year: request.Year, Coordinates: domain.Coordinates{Latitude: request.Lat, Longitude: request.Lng}, TimedOut: request.TimedOut, HintIDs: request.HintIDs,
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
