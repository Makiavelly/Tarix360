package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestCreateReportStoresSelectedArea(t *testing.T) {
	reportFile := filepath.Join(t.TempDir(), "reports.jsonl")
	handler := &Handler{reportFile: reportFile, logger: log.New(io.Discard, "", 0)}
	body := []byte(`{"gameId":"game","roundId":"round","panoramaUrl":"/panoramas/test.png","description":"Неверная деталь","x":0.1,"y":0.2,"width":0.3,"height":0.4,"yaw":1.2,"pitch":-0.1}`)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/reports", bytes.NewReader(body))
	response := httptest.NewRecorder()

	handler.createReport(response, request)
	if response.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
	}
	stored, err := os.ReadFile(reportFile)
	if err != nil {
		t.Fatal(err)
	}
	var report map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(stored), &report); err != nil {
		t.Fatal(err)
	}
	if report["description"] != "Неверная деталь" || report["createdAt"] == "" {
		t.Fatalf("unexpected stored report: %v", report)
	}
}
