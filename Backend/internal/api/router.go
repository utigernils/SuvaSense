package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(handler *Handler) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

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
