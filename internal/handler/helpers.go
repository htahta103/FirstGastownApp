package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"todoflow/internal/apierr"
	"todoflow/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func decodeJSON(r *http.Request, v interface{}) *apierr.AppError {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		return apierr.BadRequest("invalid JSON body")
	}
	return nil
}

func pathUUID(r *http.Request, param string) (uuid.UUID, *apierr.AppError) {
	raw := chi.URLParam(r, param)
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.Nil, apierr.BadRequest(param + " must be a valid UUID")
	}
	return id, nil
}

func userID(r *http.Request) uuid.UUID {
	return middleware.GetUserID(r.Context())
}

func queryInt(r *http.Request, key string, def int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return def
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	return v
}
