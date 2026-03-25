package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/model"
	"todoflow/internal/repo"
)

type ProjectHandler struct {
	repo *repo.ProjectRepo
}

func NewProjectHandler(r *repo.ProjectRepo) *ProjectHandler {
	return &ProjectHandler{repo: r}
}

func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	projects, err := h.repo.List(r.Context(), userID(r))
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to list projects"))
		return
	}
	writeJSON(w, http.StatusOK, projects)
}

func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	p, err := h.repo.GetByID(r.Context(), userID(r), id)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to get project"))
		return
	}
	if p == nil {
		apierr.Write(w, apierr.NotFound("project"))
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in model.ProjectInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Name == "" {
		apierr.Write(w, apierr.Validation("name", "required"))
		return
	}
	p, err := h.repo.Create(r.Context(), userID(r), in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to create project"))
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	var in model.ProjectInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Name == "" {
		apierr.Write(w, apierr.Validation("name", "required"))
		return
	}
	p, err := h.repo.Update(r.Context(), userID(r), id, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to update project"))
		return
	}
	if p == nil {
		apierr.Write(w, apierr.NotFound("project"))
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if err := h.repo.Delete(r.Context(), userID(r), id); err != nil {
		apierr.Write(w, apierr.Internal("failed to delete project"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
