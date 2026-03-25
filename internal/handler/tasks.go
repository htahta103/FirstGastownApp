package handler

import (
	"net/http"
	"time"

	"todoflow/internal/apierr"
	"todoflow/internal/model"
	"todoflow/internal/repo"

	"github.com/google/uuid"
)

type TaskHandler struct {
	repo *repo.TaskRepo
}

func NewTaskHandler(r *repo.TaskRepo) *TaskHandler {
	return &TaskHandler{repo: r}
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	f := model.TaskFilter{
		Sort:   q.Get("sort"),
		Limit:  queryInt(r, "limit", 100),
		Offset: queryInt(r, "offset", 0),
	}
	if f.Sort == "" {
		f.Sort = "position"
	}
	if v := q.Get("project_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			apierr.Write(w, apierr.BadRequest("project_id must be a valid UUID"))
			return
		}
		f.ProjectID = &id
	}
	if v := q.Get("status"); v != "" {
		f.Status = &v
	}
	if v := q.Get("priority"); v != "" {
		f.Priority = &v
	}
	if v := q.Get("tag_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			apierr.Write(w, apierr.BadRequest("tag_id must be a valid UUID"))
			return
		}
		f.TagID = &id
	}
	if v := q.Get("due_from"); v != "" {
		f.DueFrom = &v
	}
	if v := q.Get("due_to"); v != "" {
		f.DueTo = &v
	}

	result, err := h.repo.List(r.Context(), userID(r), f)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to list tasks"))
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *TaskHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	t, err := h.repo.GetByID(r.Context(), userID(r), id)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to get task"))
		return
	}
	if t == nil {
		apierr.Write(w, apierr.NotFound("task"))
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in model.TaskInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.ProjectID == uuid.Nil {
		apierr.Write(w, apierr.Validation("project_id", "required"))
		return
	}
	if in.Title == "" {
		apierr.Write(w, apierr.Validation("title", "required"))
		return
	}
	if len(in.Title) > 500 {
		apierr.Write(w, apierr.Validation("title", "maxLength is 500"))
		return
	}

	if in.DueDate != nil {
		// The DB column is DATE, so accept only YYYY-MM-DD to avoid 500s from SQL.
		if *in.DueDate == "" {
			apierr.Write(w, apierr.Validation("due_date", "must be a valid date (YYYY-MM-DD)"))
			return
		}
		if _, err := time.Parse("2006-01-02", *in.DueDate); err != nil {
			apierr.Write(w, apierr.Validation("due_date", "must be a valid date (YYYY-MM-DD)"))
			return
		}
	}

	if in.Priority != nil {
		switch *in.Priority {
		case "urgent", "high", "medium", "low":
		default:
			apierr.Write(w, apierr.Validation("priority", "must be one of: urgent, high, medium, low"))
			return
		}
	}

	if in.Status != nil {
		switch *in.Status {
		case "todo", "in_progress", "done":
		default:
			apierr.Write(w, apierr.Validation("status", "must be one of: todo, in_progress, done"))
			return
		}
	}

	t, err := h.repo.Create(r.Context(), userID(r), in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to create task"))
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	var in model.TaskUpdate
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	t, err := h.repo.Update(r.Context(), userID(r), id, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to update task"))
		return
	}
	if t == nil {
		apierr.Write(w, apierr.NotFound("task"))
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *TaskHandler) UpdatePosition(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	var in model.PositionUpdate
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	t, err := h.repo.UpdatePosition(r.Context(), userID(r), id, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to update task position"))
		return
	}
	if t == nil {
		apierr.Write(w, apierr.NotFound("task"))
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if err := h.repo.Delete(r.Context(), userID(r), id); err != nil {
		apierr.Write(w, apierr.Internal("failed to delete task"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
