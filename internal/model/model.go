package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
}

type Project struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"-"`
	Name      string    `json:"name"`
	Icon      string    `json:"icon"`
	Color     string    `json:"color"`
	TaskCount int       `json:"task_count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ProjectInput struct {
	Name  string  `json:"name"`
	Icon  *string `json:"icon"`
	Color *string `json:"color"`
}

type Task struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"-"`
	ProjectID        uuid.UUID `json:"project_id"`
	Title            string    `json:"title"`
	Description      *string   `json:"description"`
	DueDate          *string   `json:"due_date"`
	Priority         string    `json:"priority"`
	Status           string    `json:"status"`
	Position         float64   `json:"position"`
	SubtaskTotal     int       `json:"subtask_total"`
	SubtaskCompleted int       `json:"subtask_completed"`
	Tags             []Tag     `json:"tags"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type TaskInput struct {
	ProjectID   uuid.UUID `json:"project_id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	DueDate     *string   `json:"due_date"`
	Priority    *string   `json:"priority"`
	Status      *string   `json:"status"`
}

type TaskUpdate struct {
	ProjectID   *uuid.UUID `json:"project_id"`
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	DueDate     *string    `json:"due_date"`
	Priority    *string    `json:"priority"`
	Status      *string    `json:"status"`
}

type PositionUpdate struct {
	Position float64 `json:"position"`
	Status   *string `json:"status"`
}

type TaskListResult struct {
	Tasks []Task `json:"tasks"`
	Total int    `json:"total"`
}

// TaskCalendarDay is a sparse calendar cell: only dates that have at least one task.
type TaskCalendarDay struct {
	Date  string `json:"date"`
	Tasks []Task `json:"tasks"`
}

// TaskCalendarResult is the payload for GET /tasks/calendar (monthly/weekly ranges via from/to).
type TaskCalendarResult struct {
	From  string            `json:"from"`
	To    string            `json:"to"`
	Days  []TaskCalendarDay `json:"days"`
	Total int               `json:"total"`
}

type TaskCalendarFilter struct {
	ProjectID *uuid.UUID
	Status    *string
	Priority  *string
	TagID     *uuid.UUID
}

type TaskFilter struct {
	ProjectID *uuid.UUID
	Status    *string
	Priority  *string
	TagID     *uuid.UUID
	DueFrom   *string
	DueTo     *string
	Sort      string
	Limit     int
	Offset    int
}

type Subtask struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"-"`
	TaskID    uuid.UUID `json:"task_id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	Position  float64   `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SubtaskInput struct {
	Title string `json:"title"`
}

type Tag struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"-"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type TagInput struct {
	Name  string  `json:"name"`
	Color *string `json:"color"`
}

type SavedFilter struct {
	ID         uuid.UUID              `json:"id"`
	UserID     uuid.UUID              `json:"-"`
	Name       string                 `json:"name"`
	FilterJSON map[string]interface{} `json:"filter_json"`
	CreatedAt  time.Time              `json:"created_at"`
}

type SavedFilterInput struct {
	Name       string                 `json:"name"`
	FilterJSON map[string]interface{} `json:"filter_json"`
}

type Dashboard struct {
	TotalTasks        int               `json:"total_tasks"`
	CompletedToday    int               `json:"completed_today"`
	OverdueCount      int               `json:"overdue_count"`
	ProjectProgress   []ProjectProgress `json:"project_progress"`
	RecentActivity    []Activity        `json:"recent_activity"`
	UpcomingDeadlines []Task            `json:"upcoming_deadlines"`
}

type ProjectProgress struct {
	ProjectID   uuid.UUID `json:"project_id"`
	ProjectName string    `json:"project_name"`
	Total       int       `json:"total"`
	Completed   int       `json:"completed"`
}

type Activity struct {
	ID        uuid.UUID `json:"id"`
	Action    string    `json:"action"`
	TaskTitle string    `json:"task_title"`
	Timestamp time.Time `json:"timestamp"`
}
