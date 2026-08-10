package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// corsMiddleware setzt die noetigen CORS-Header auf jede
// Response, damit Browser-basierte Apps (z.B. die AE-App
// auf http://localhost:5500 via Live Server) die API auf
// http://localhost:8080 abfragen koennen.
//
// Ohne diese Header blockt der Browser den Cross-Origin-
// Request mit "CORS policy: No 'Access-Control-Allow-Origin'
// header is present".
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
		w.Header().Set("Access-Control-Max-Age", "86400") // 24h Preflight-Cache
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func NewRouter(handler *Handler) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	r.Get("/health", handler.Health)

	r.Route("/api/v1", func(api chi.Router) {
		api.Get("/sensors", handler.ListSensors)
		api.Get("/sensors/{serial}", handler.GetSensorBySerial)
		api.Get("/sensors/{serial}/latest", handler.GetSensorLatestSnapshot)
		api.Get("/sensors/{serial}/readings", handler.ListAllReadings)
		api.Get("/sensors/{serial}/readings/{sensorType}", handler.ListReadingsByType)
		api.Get("/sensors/{serial}/readings/{sensorType}/latest", handler.GetLatestReadingByType)
	})

	return r
}
