package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"todoflow/internal/middleware"
	"todoflow/internal/model"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type mockProjectRepo struct {
	listFn    func(ctx context.Context, userID uuid.UUID) ([]model.Project, error)
	getByIDFn func(ctx context.Context, userID, id uuid.UUID) (*model.Project, error)
	createFn  func(ctx context.Context, userID uuid.UUID, in model.ProjectInput) (*model.Project, error)
	updateFn  func(ctx context.Context, userID, id uuid.UUID, in model.ProjectInput) (*model.Project, error)
	deleteFn  func(ctx context.Context, userID, id uuid.UUID) error
}

func (m *mockProjectRepo) List(ctx context.Context, userID uuid.UUID) ([]model.Project, error) {
	if m.listFn != nil {
		return m.listFn(ctx, userID)
	}
	return nil, nil
}

func (m *mockProjectRepo) GetByID(ctx context.Context, userID, id uuid.UUID) (*model.Project, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, userID, id)
	}
	return nil, nil
}

func (m *mockProjectRepo) Create(ctx context.Context, userID uuid.UUID, in model.ProjectInput) (*model.Project, error) {
	if m.createFn != nil {
		return m.createFn(ctx, userID, in)
	}
	return nil, nil
}

func (m *mockProjectRepo) Update(ctx context.Context, userID, id uuid.UUID, in model.ProjectInput) (*model.Project, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, userID, id, in)
	}
	return nil, nil
}

func (m *mockProjectRepo) Delete(ctx context.Context, userID, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, userID, id)
	}
	return nil
}

func testUserID() uuid.UUID {
	return uuid.MustParse("11111111-1111-1111-1111-111111111111")
}

func newProjectTestRouter(h *ProjectHandler) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.UserID)
	r.Get("/projects", h.List)
	r.Post("/projects", h.Create)
	r.Route("/projects/{id}", func(r chi.Router) {
		r.Get("/", h.Get)
		r.Put("/", h.Update)
		r.Delete("/", h.Delete)
	})
	return r
}

func TestProjectHandler_Create_validation(t *testing.T) {
	h := NewProjectHandler(&mockProjectRepo{})
	srv := newProjectTestRouter(h)

	body := []byte(`{"name":""}`)
	req := httptest.NewRequest(http.MethodPost, "/projects", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusUnprocessableEntity)
	}
}

func TestProjectHandler_Create_success(t *testing.T) {
	pid := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	now := time.Date(2026, 3, 1, 12, 0, 0, 0, time.UTC)
	icon := "inbox"
	color := "#FF0000"

	h := NewProjectHandler(&mockProjectRepo{
		createFn: func(ctx context.Context, userID uuid.UUID, in model.ProjectInput) (*model.Project, error) {
			if userID != testUserID() {
				t.Fatalf("userID = %v", userID)
			}
			if in.Name != "Alpha" {
				t.Fatalf("name = %q", in.Name)
			}
			if in.Icon == nil || *in.Icon != icon {
				t.Fatalf("icon = %v", in.Icon)
			}
			if in.Color == nil || *in.Color != color {
				t.Fatalf("color = %v", in.Color)
			}
			return &model.Project{
				ID:        pid,
				Name:      "Alpha",
				Icon:      icon,
				Color:     color,
				TaskCount: 0,
				CreatedAt: now,
				UpdatedAt: now,
			}, nil
		},
	})
	srv := newProjectTestRouter(h)

	body := []byte(`{"name":"Alpha","icon":"inbox","color":"#FF0000"}`)
	req := httptest.NewRequest(http.MethodPost, "/projects", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d body=%s", w.Code, http.StatusCreated, w.Body.String())
	}
	var got model.Project
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.ID != pid || got.Name != "Alpha" || got.Icon != icon || got.Color != color || got.TaskCount != 0 {
		t.Fatalf("response = %+v", got)
	}
}

func TestProjectHandler_Get_notFound(t *testing.T) {
	h := NewProjectHandler(&mockProjectRepo{
		getByIDFn: func(ctx context.Context, userID, id uuid.UUID) (*model.Project, error) {
			return nil, nil
		},
	})
	srv := newProjectTestRouter(h)

	pid := uuid.MustParse("33333333-3333-3333-3333-333333333333")
	req := httptest.NewRequest(http.MethodGet, "/projects/"+pid.String(), nil)
	req.Header.Set("X-User-Id", testUserID().String())

	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestProjectHandler_List(t *testing.T) {
	h := NewProjectHandler(&mockProjectRepo{
		listFn: func(ctx context.Context, userID uuid.UUID) ([]model.Project, error) {
			return []model.Project{{Name: "P1", Icon: "folder", Color: "#3B82F6", TaskCount: 2}}, nil
		},
	})
	srv := newProjectTestRouter(h)

	req := httptest.NewRequest(http.MethodGet, "/projects", nil)
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d", w.Code)
	}
	var got []model.Project
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].Name != "P1" || got[0].TaskCount != 2 {
		t.Fatalf("response = %+v", got)
	}
}

func TestProjectHandler_Delete(t *testing.T) {
	var deleted uuid.UUID
	h := NewProjectHandler(&mockProjectRepo{
		deleteFn: func(ctx context.Context, userID, id uuid.UUID) error {
			deleted = id
			return nil
		},
	})
	srv := newProjectTestRouter(h)

	pid := uuid.MustParse("44444444-4444-4444-4444-444444444444")
	req := httptest.NewRequest(http.MethodDelete, "/projects/"+pid.String(), nil)
	req.Header.Set("X-User-Id", testUserID().String())

	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("status = %d", w.Code)
	}
	if deleted != pid {
		t.Fatalf("deleted id = %v", deleted)
	}
}
