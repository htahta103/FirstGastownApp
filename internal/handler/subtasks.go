package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/model"
	"todoflow/internal/repo"

	"github.com/google/uuid"
)

type SubtaskHandler struct {
	subtasks *repo.SubtaskRepo
	tasks    *repo.TaskRepo
}

func NewSubtaskHandler(sub *repo.SubtaskRepo, tasks *repo.TaskRepo) *SubtaskHandler {
	return &SubtaskHandler{subtasks: sub, tasks: tasks}
}

func (h *SubtaskHandler) syncParent(r *http.Request, taskID uuid.UUID) {
	_ = h.tasks.SyncStatusWithSubtasks(r.Context(), userID(r), taskID)
}

func (h *SubtaskHandler) List(w http.ResponseWriter, r *http.Request) {
	taskID, appErr := pathUUID(r, "taskId")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	ok, err := h.tasks.ExistsForUser(r.Context(), userID(r), taskID)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to verify task"))
		return
	}
	if !ok {
		apierr.Write(w, apierr.NotFound("task"))
		return
	}
	subtasks, err := h.subtasks.ListByTask(r.Context(), userID(r), taskID)
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
	ok, err := h.tasks.ExistsForUser(r.Context(), userID(r), taskID)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to verify task"))
		return
	}
	if !ok {
		apierr.Write(w, apierr.NotFound("task"))
		return
	}
	s, err := h.subtasks.Create(r.Context(), userID(r), taskID, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to create subtask"))
		return
	}
	h.syncParent(r, taskID)
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
	s, err := h.subtasks.Update(r.Context(), userID(r), id, in)
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
	s, err := h.subtasks.Toggle(r.Context(), userID(r), id)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to toggle subtask"))
		return
	}
	if s == nil {
		apierr.Write(w, apierr.NotFound("subtask"))
		return
	}
	h.syncParent(r, s.TaskID)
	writeJSON(w, http.StatusOK, s)
}

func (h *SubtaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	taskID, err := h.subtasks.Delete(r.Context(), userID(r), id)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to delete subtask"))
		return
	}
	if taskID == uuid.Nil {
		apierr.Write(w, apierr.NotFound("subtask"))
		return
	}
	h.syncParent(r, taskID)
	w.WriteHeader(http.StatusNoContent)
}
