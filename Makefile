.PHONY: dev backend frontend test build

dev:
	docker compose up --build

backend:
	cd backend && GOCACHE=/tmp/tarix360-go-cache go run ./cmd/server

frontend:
	cd frontend && npm run dev

test:
	cd backend && GOCACHE=/tmp/tarix360-go-cache go test ./...
	cd frontend && npm run lint && npm run build

build:
	cd backend && GOCACHE=/tmp/tarix360-go-cache go build ./cmd/server
	cd frontend && npm run build

