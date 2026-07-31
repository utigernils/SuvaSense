package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"SuvaSense_Backend/internal/domain"
	"SuvaSense_Backend/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	repo              *store.Repository
	onlineThresholdSec int
}

func NewHandler(repo *store.Repository, onlineThresholdSec int) *Handler {
	return &Handler{repo: repo, onlineThresholdSec: onlineThresholdSec}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	respondJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

func (h *Handler) ListSensors(w http.ResponseWriter, r *http.Request) {
	page := parseIntOrDefault(r.URL.Query().Get("page"), 1)
	pageSize := parseIntOrDefault(r.URL.Query().Get("page_size"), 50)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 500 {
		pageSize = 500
	}

	sensors, err := h.repo.ListSensors(r.Context(), page, pageSize)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list sensors")
		return
	}

	statusFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))
	out := make([]domain.Sensor, 0, len(sensors))
	for _, s := range sensors {
		s.Status = store.ComputeStatus(s.LastSeenAt, h.onlineThresholdSec)
		if statusFilter != "" && statusFilter != s.Status {
			continue
		}
		out = append(out, s)
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"page":      page,
		"page_size": pageSize,
		"items":     out,
	})
}

func (h *Handler) GetSensorBySerial(w http.ResponseWriter, r *http.Request) {
	serial := chi.URLParam(r, "serial")
	sensor, err := h.repo.GetSensorBySerial(r.Context(), serial)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "sensor not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to load sensor")
		return
	}

	sensor.Status = store.ComputeStatus(sensor.LastSeenAt, h.onlineThresholdSec)
	counts, err := h.repo.CountReadingsByType(r.Context(), serial)
	if err == nil {
		sensor.ReadingsByType = counts
	}

	respondJSON(w, http.StatusOK, sensor)
}

func (h *Handler) GetSensorLatestSnapshot(w http.ResponseWriter, r *http.Request) {
	serial := chi.URLParam(r, "serial")
	latest, err := h.repo.GetLatestByType(r.Context(), serial)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load latest snapshot")
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{
		"serial_number": serial,
		"latest":        latest,
	})
}

func (h *Handler) GetLatestReadingByType(w http.ResponseWriter, r *http.Request) {
	serial := chi.URLParam(r, "serial")
	sensorType := strings.ToLower(strings.TrimSpace(chi.URLParam(r, "sensorType")))
	if !domain.IsValidSensorType(sensorType) {
		respondError(w, http.StatusBadRequest, "invalid sensor type")
		return
	}

	rec, err := h.repo.GetLatestReadingForSensorType(r.Context(), serial, sensorType)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "no readings found")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to load latest reading")
		return
	}

	respondJSON(w, http.StatusOK, rec)
}

func (h *Handler) ListReadingsByType(w http.ResponseWriter, r *http.Request) {
	serial := chi.URLParam(r, "serial")
	sensorType := strings.ToLower(strings.TrimSpace(chi.URLParam(r, "sensorType")))
	if !domain.IsValidSensorType(sensorType) {
		respondError(w, http.StatusBadRequest, "invalid sensor type")
		return
	}

	filter, err := parseReadingFilter(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	readings, err := h.repo.ListReadings(r.Context(), serial, sensorType, filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list readings")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"serial_number": serial,
		"sensor_type":   sensorType,
		"page":          filter.Page,
		"page_size":     filter.PageSize,
		"items":         readings,
	})
}

func parseReadingFilter(r *http.Request) (domain.ReadingFilter, error) {
	q := r.URL.Query()
	page := parseIntOrDefault(q.Get("page"), 1)
	pageSize := parseIntOrDefault(q.Get("page_size"), 100)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 100
	}
	if pageSize > 1000 {
		pageSize = 1000
	}

	filter := domain.ReadingFilter{
		Page:      page,
		PageSize:  pageSize,
		FieldMins: map[string]float64{},
		FieldMaxs: map[string]float64{},
	}

	if fromRaw := strings.TrimSpace(q.Get("from")); fromRaw != "" {
		from, err := time.Parse(time.RFC3339, fromRaw)
		if err != nil {
			return domain.ReadingFilter{}, errors.New("invalid from timestamp, expected RFC3339")
		}
		filter.From = &from
	}

	if toRaw := strings.TrimSpace(q.Get("to")); toRaw != "" {
		to, err := time.Parse(time.RFC3339, toRaw)
		if err != nil {
			return domain.ReadingFilter{}, errors.New("invalid to timestamp, expected RFC3339")
		}
		filter.To = &to
	}

	for key, values := range q {
		if len(values) == 0 {
			continue
		}
		if strings.HasSuffix(key, "_min") {
			field := strings.TrimSuffix(key, "_min")
			v, err := strconv.ParseFloat(values[0], 64)
			if err != nil {
				return domain.ReadingFilter{}, errors.New("invalid min numeric filter for " + field)
			}
			filter.FieldMins[field] = v
		}
		if strings.HasSuffix(key, "_max") {
			field := strings.TrimSuffix(key, "_max")
			v, err := strconv.ParseFloat(values[0], 64)
			if err != nil {
				return domain.ReadingFilter{}, errors.New("invalid max numeric filter for " + field)
			}
			filter.FieldMaxs[field] = v
		}
	}

	return filter, nil
}

func parseIntOrDefault(value string, fallback int) int {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	v, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return v
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]any{
		"error": message,
	})
}
