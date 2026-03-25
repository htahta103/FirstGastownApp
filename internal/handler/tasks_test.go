package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"todoflow/internal/middleware"
	"todoflow/internal/model"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type mockTaskRepo struct {
	listFn              func(ctx context.Context, userID uuid.UUID, f model.TaskFilter) (*model.TaskListResult, error)
	listCalendarRangeFn func(ctx context.Context, userID uuid.UUID, from, to string, f model.TaskCalendarFilter) ([]model.Task, error)
	getByIDFn           func(ctx context.Context, userID, id uuid.UUID) (*model.Task, error)
	createFn            func(ctx context.Context, userID uuid.UUID, in model.TaskInput) (*model.Task, error)
	updateFn            func(ctx context.Context, userID uuid.UUID, id uuid.UUID, in model.TaskUpdate) (*model.Task, error)
	updatePositionFn    func(ctx context.Context, userID uuid.UUID, id uuid.UUID, in model.PositionUpdate) (*model.Task, error)
	deleteFn            func(ctx context.Context, userID, id uuid.UUID) error
}

func (m *mockTaskRepo) List(ctx context.Context, userID uuid.UUID, f model.TaskFilter) (*model.TaskListResult, error) {
	if m.listFn != nil {
		return m.listFn(ctx, userID, f)
	}
	return &model.TaskListResult{Tasks: []model.Task{}, Total: 0}, nil
}

func (m *mockTaskRepo) ListCalendarRange(ctx context.Context, userID uuid.UUID, from, to string, f model.TaskCalendarFilter) ([]model.Task, error) {
	if m.listCalendarRangeFn != nil {
		return m.listCalendarRangeFn(ctx, userID, from, to, f)
	}
	return []model.Task{}, nil
}

func (m *mockTaskRepo) GetByID(ctx context.Context, userID, id uuid.UUID) (*model.Task, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, userID, id)
	}
	return nil, nil
}

func (m *mockTaskRepo) Create(ctx context.Context, userID uuid.UUID, in model.TaskInput) (*model.Task, error) {
	if m.createFn != nil {
		return m.createFn(ctx, userID, in)
	}
	return nil, nil
}

func (m *mockTaskRepo) Update(ctx context.Context, userID uuid.UUID, id uuid.UUID, in model.TaskUpdate) (*model.Task, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, userID, id, in)
	}
	return nil, nil
}

func (m *mockTaskRepo) UpdatePosition(ctx context.Context, userID uuid.UUID, id uuid.UUID, in model.PositionUpdate) (*model.Task, error) {
	if m.updatePositionFn != nil {
		return m.updatePositionFn(ctx, userID, id, in)
	}
	return nil, nil
}

func (m *mockTaskRepo) Delete(ctx context.Context, userID, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, userID, id)
	}
	return nil
}

func newTaskCalendarTestRouter(h *TaskHandler) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.UserID)
	r.Get("/tasks/calendar", h.Calendar)
	return r
}

func TestTaskHandler_Calendar_missingFromOrTo(t *testing.T) {
	h := NewTaskHandler(&mockTaskRepo{})
	srv := newTaskCalendarTestRouter(h)

	req := httptest.NewRequest(http.MethodGet, "/tasks/calendar?to=2026-03-31", nil)
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d body=%s", w.Code, http.StatusBadRequest, w.Body.String())
	}

	req2 := httptest.NewRequest(http.MethodGet, "/tasks/calendar?from=2026-03-01", nil)
	req2.Header.Set("X-User-Id", testUserID().String())
	w2 := httptest.NewRecorder()
	srv.ServeHTTP(w2, req2)
	if w2.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w2.Code, http.StatusBadRequest)
	}
}

func TestTaskHandler_Calendar_invalidDates(t *testing.T) {
	h := NewTaskHandler(&mockTaskRepo{})
	srv := newTaskCalendarTestRouter(h)

	req := httptest.NewRequest(http.MethodGet, "/tasks/calendar?from=not-a-date&to=2026-03-31", nil)
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestTaskHandler_Calendar_fromAfterTo(t *testing.T) {
	h := NewTaskHandler(&mockTaskRepo{})
	srv := newTaskCalendarTestRouter(h)

	req := httptest.NewRequest(http.MethodGet, "/tasks/calendar?from=2026-03-31&to=2026-03-01", nil)
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestTaskHandler_Calendar_invalidProjectID(t *testing.T) {
	h := NewTaskHandler(&mockTaskRepo{})
	srv := newTaskCalendarTestRouter(h)

	req := httptest.NewRequest(http.MethodGet, "/tasks/calendar?from=2026-03-01&to=2026-03-31&project_id=bad", nil)
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d body=%s", w.Code, http.StatusBadRequest, w.Body.String())
	}
}

func TestTaskHandler_Calendar_success(t *testing.T) {
	d1 := "2026-03-10"
	tid := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	h := NewTaskHandler(&mockTaskRepo{
		listCalendarRangeFn: func(ctx context.Context, userID uuid.UUID, from, to string, f model.TaskCalendarFilter) ([]model.Task, error) {
			if userID != testUserID() {
				t.Fatalf("userID = %v", userID)
			}
			if from != "2026-03-01" || to != "2026-03-31" {
				t.Fatalf("range = %q .. %q", from, to)
			}
			if f.ProjectID != nil || f.Status != nil || f.Priority != nil || f.TagID != nil {
				t.Fatalf("filter = %+v", f)
			}
			return []model.Task{{ID: tid, Title: "A", DueDate: &d1}}, nil
		},
	})
	srv := newTaskCalendarTestRouter(h)

	req := httptest.NewRequest(http.MethodGet, "/tasks/calendar?from=2026-03-01&to=2026-03-31", nil)
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d body=%s", w.Code, http.StatusOK, w.Body.String())
	}
	var got model.TaskCalendarResult
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.From != "2026-03-01" || got.To != "2026-03-31" || got.Total != 1 {
		t.Fatalf("meta = %+v", got)
	}
	if len(got.Days) != 1 || got.Days[0].Date != d1 || len(got.Days[0].Tasks) != 1 || got.Days[0].Tasks[0].ID != tid {
		t.Fatalf("days = %+v", got.Days)
	}
}

func TestTaskHandler_Calendar_repoError(t *testing.T) {
	h := NewTaskHandler(&mockTaskRepo{
		listCalendarRangeFn: func(ctx context.Context, userID uuid.UUID, from, to string, f model.TaskCalendarFilter) ([]model.Task, error) {
			return nil, context.Canceled
		},
	})
	srv := newTaskCalendarTestRouter(h)

	req := httptest.NewRequest(http.MethodGet, "/tasks/calendar?from=2026-03-01&to=2026-03-31", nil)
	req.Header.Set("X-User-Id", testUserID().String())
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
}
