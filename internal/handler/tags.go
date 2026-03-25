package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/model"
	"todoflow/internal/repo"
)

type TagHandler struct {
	repo *repo.TagRepo
}

func NewTagHandler(r *repo.TagRepo) *TagHandler {
	return &TagHandler{repo: r}
}

func (h *TagHandler) List(w http.ResponseWriter, r *http.Request) {
	tags, err := h.repo.List(r.Context(), userID(r))
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to list tags"))
		return
	}
	writeJSON(w, http.StatusOK, tags)
}

func (h *TagHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in model.TagInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Name == "" {
		apierr.Write(w, apierr.Validation("name", "required"))
		return
	}
	t, err := h.repo.Create(r.Context(), userID(r), in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to create tag"))
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (h *TagHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	var in model.TagInput
	if appErr := decodeJSON(r, &in); appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if in.Name == "" {
		apierr.Write(w, apierr.Validation("name", "required"))
		return
	}
	t, err := h.repo.Update(r.Context(), userID(r), id, in)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to update tag"))
		return
	}
	if t == nil {
		apierr.Write(w, apierr.NotFound("tag"))
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *TagHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, appErr := pathUUID(r, "id")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if err := h.repo.Delete(r.Context(), userID(r), id); err != nil {
		apierr.Write(w, apierr.Internal("failed to delete tag"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TagHandler) AttachToTask(w http.ResponseWriter, r *http.Request) {
	taskID, appErr := pathUUID(r, "taskId")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	tagID, appErr := pathUUID(r, "tagId")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if err := h.repo.AttachToTask(r.Context(), userID(r), taskID, tagID); err != nil {
		apierr.Write(w, apierr.Internal("failed to attach tag"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TagHandler) DetachFromTask(w http.ResponseWriter, r *http.Request) {
	taskID, appErr := pathUUID(r, "taskId")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	tagID, appErr := pathUUID(r, "tagId")
	if appErr != nil {
		apierr.Write(w, appErr)
		return
	}
	if err := h.repo.DetachFromTask(r.Context(), userID(r), taskID, tagID); err != nil {
		apierr.Write(w, apierr.Internal("failed to detach tag"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
