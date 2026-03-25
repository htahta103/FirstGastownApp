package handler

import (
	"net/http"

	"todoflow/internal/apierr"
	"todoflow/internal/repo"
)

type UserHandler struct {
	repo *repo.UserRepo
}

func NewUserHandler(r *repo.UserRepo) *UserHandler {
	return &UserHandler{repo: r}
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	uid := userID(r)
	u, err := h.repo.Upsert(r.Context(), uid)
	if err != nil {
		apierr.Write(w, apierr.Internal("failed to create user"))
		return
	}
	writeJSON(w, http.StatusOK, u)
}
