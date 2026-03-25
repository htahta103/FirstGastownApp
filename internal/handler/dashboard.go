package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/repo"
)

type DashboardHandler struct {
	repo *repo.DashboardRepo
}

func NewDashboardHandler(r *repo.DashboardRepo) *DashboardHandler {
	return &DashboardHandler{repo: r}
}

func (h *DashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
	d, err := h.repo.Get(r.Context(), userID(r))
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to load dashboard"))
		return
	}
	writeJSON(w, http.StatusOK, d)
}
