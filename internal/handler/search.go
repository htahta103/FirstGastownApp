package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/repo"
)

type SearchHandler struct {
	repo *repo.SearchRepo
}

func NewSearchHandler(r *repo.SearchRepo) *SearchHandler {
	return &SearchHandler{repo: r}
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		apierr.Write(w, apierr.Validation("q", "required"))
		return
	}
	limit := queryInt(r, "limit", 20)
	tasks, err := h.repo.Search(r.Context(), userID(r), q, limit)
	if err != nil {
		apierr.Write(w, apierr.Internal("search failed"))
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}
