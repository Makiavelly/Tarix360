package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/example/tarix360/backend/internal/repository/filesystem"
	"github.com/example/tarix360/backend/internal/repository/memory"
	"github.com/example/tarix360/backend/internal/service"
	"github.com/example/tarix360/backend/internal/transport/httpapi"
)

func main() {
	logger := log.New(os.Stdout, "tarix360: ", log.LstdFlags|log.LUTC)
	storageDir := env("STORAGE_DIR", "storage")
	address := env("HTTP_ADDR", ":8080")

	events, err := filesystem.NewEventRepository(filepath.Join(storageDir, "events.json"))
	if err != nil {
		logger.Printf("load catalog: %v", err)
		os.Exit(1)
	}
	gameService := service.NewGameService(events, memory.NewGameRepository())
	handler := httpapi.NewHandler(gameService, filepath.Join(storageDir, "panoramas"), logger)

	server := &http.Server{
		Addr: address, Handler: handler,
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second,
		WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second,
	}
	logger.Printf("API is listening on %s", address)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Printf("server stopped: %v", err)
		os.Exit(1)
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
