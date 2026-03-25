package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/model"
	"todoflow/internal/repo"
)

type FilterHandler struct {
	repo *repo.FilterRepo
}

func NewFilterHandler(r *repo.FilterRepo) *FilterHandler {
	return &FilterHandler{repo: r}
}

func (h *FilterHandler) List(w http.ResponseWriter, r *http.Request) {
	filters, err := h.repo.List(r.Context(), userID(r))
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to list filters"))
		return
	}
	writeJSON(w, http.StatusOK, filters)
}

func (h *FilterHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in model.SavedFilterInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Name == "" {
		apierr.Write(w, apierr.Validation("name", "required"))
		return
	}
	if in.FilterJSON == nil {
		apierr.Write(w, apierr.Validation("filter_json", "required"))
		return
	}
	f, err := h.repo.Create(r.Context(), userID(r), in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to create filter"))
		return
	}
	writeJSON(w, http.StatusCreated, f)
}

func (h *FilterHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	var in model.SavedFilterInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Name == "" {
		apierr.Write(w, apierr.Validation("name", "required"))
		return
	}
	f, err := h.repo.Update(r.Context(), userID(r), id, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to update filter"))
		return
	}
	if f == nil {
		apierr.Write(w, apierr.NotFound("filter"))
		return
	}
	writeJSON(w, http.StatusOK, f)
}

func (h *FilterHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if err := h.repo.Delete(r.Context(), userID(r), id); err != nil {
		apierr.Write(w, apierr.Internal("failed to delete filter"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
