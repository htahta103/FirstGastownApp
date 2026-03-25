package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/model"
	"todoflow/internal/repo"

	"github.com/google/uuid"
)

type SearchHandler struct {
	repo *repo.SearchRepo
}

func NewSearchHandler(r *repo.SearchRepo) *SearchHandler {
	return &SearchHandler{repo: r}
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	q := params.Get("q")
	if q == "" {
		apierr.Write(w, apierr.Validation("q", "required"))
		return
	}

	limit := queryInt(r, "limit", 20)
	f := model.TaskFilter{
		Limit: limit,
	}

	if v := params.Get("project_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			apierr.Write(w, apierr.BadRequest("project_id must be a valid UUID"))
			return
		}
		f.ProjectID = &id
	}
	if v := params.Get("status"); v != "" {
		f.Status = &v
	}
	if v := params.Get("priority"); v != "" {
		f.Priority = &v
	}
	if v := params.Get("tag_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			apierr.Write(w, apierr.BadRequest("tag_id must be a valid UUID"))
			return
		}
		f.TagID = &id
	}
	if v := params.Get("due_from"); v != "" {
		f.DueFrom = &v
	}
	if v := params.Get("due_to"); v != "" {
		f.DueTo = &v
	}

	tasks, err := h.repo.Search(r.Context(), userID(r), q, f)
	if err != nil {
		apierr.Write(w, apierr.Internal("search failed"))
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}
