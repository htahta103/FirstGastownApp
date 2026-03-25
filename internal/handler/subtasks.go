package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/model"
	"todoflow/internal/repo"
)

type SubtaskHandler struct {
	repo *repo.SubtaskRepo
}

func NewSubtaskHandler(r *repo.SubtaskRepo) *SubtaskHandler {
	return &SubtaskHandler{repo: r}
}

func (h *SubtaskHandler) List(w http.ResponseWriter, r *http.Request) {
	taskID, appErr := pathUUID(r, "taskId")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	subtasks, err := h.repo.ListByTask(r.Context(), userID(r), taskID)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to list subtasks"))
		return
	}
	writeJSON(w, http.StatusOK, subtasks)
}

func (h *SubtaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	taskID, appErr := pathUUID(r, "taskId")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	var in model.SubtaskInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Title == "" {
		apierr.Write(w, apierr.Validation("title", "required"))
		return
	}
	s, err := h.repo.Create(r.Context(), userID(r), taskID, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to create subtask"))
		return
	}
	writeJSON(w, http.StatusCreated, s)
}

func (h *SubtaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	var in model.SubtaskInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Title == "" {
		apierr.Write(w, apierr.Validation("title", "required"))
		return
	}
	s, err := h.repo.Update(r.Context(), userID(r), id, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to update subtask"))
		return
	}
	if s == nil {
		apierr.Write(w, apierr.NotFound("subtask"))
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *SubtaskHandler) Toggle(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	s, err := h.repo.Toggle(r.Context(), userID(r), id)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to toggle subtask"))
		return
	}
	if s == nil {
		apierr.Write(w, apierr.NotFound("subtask"))
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *SubtaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if err := h.repo.Delete(r.Context(), userID(r), id); err != nil {
		apierr.Write(w, apierr.Internal("failed to delete subtask"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
