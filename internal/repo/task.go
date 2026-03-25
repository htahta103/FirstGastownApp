package repo

import (
	"context"
	"fmt"
	"strings"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskRepo struct {
	pool *pgxpool.Pool
}

func NewTaskRepo(pool *pgxpool.Pool) *TaskRepo {
	return &TaskRepo{pool: pool}
}

func (r *TaskRepo) List(ctx context.Context, userID uuid.UUID, f model.TaskFilter) (*model.TaskListResult, error) {
	var (
		where  []string
		args   []interface{}
		argIdx = 1
	)

	where = append(where, fmt.Sprintf("t.user_id = $%d", argIdx))
	args = append(args, userID)
	argIdx++

	if f.ProjectID != nil {
		where = append(where, fmt.Sprintf("t.project_id = $%d", argIdx))
		args = append(args, *f.ProjectID)
		argIdx++
	}
	if f.Status != nil {
		where = append(where, fmt.Sprintf("t.status = $%d", argIdx))
		args = append(args, *f.Status)
		argIdx++
	}
	if f.Priority != nil {
		where = append(where, fmt.Sprintf("t.priority = $%d", argIdx))
		args = append(args, *f.Priority)
		argIdx++
	}
	if f.DueFrom != nil {
		where = append(where, fmt.Sprintf("t.due_date >= $%d", argIdx))
		args = append(args, *f.DueFrom)
		argIdx++
	}
	if f.DueTo != nil {
		where = append(where, fmt.Sprintf("t.due_date <= $%d", argIdx))
		args = append(args, *f.DueTo)
		argIdx++
	}
	if f.TagID != nil {
		where = append(where, fmt.Sprintf(
			"EXISTS (SELECT 1 FROM task_tags tt WHERE tt.task_id = t.id AND tt.tag_id = $%d)", argIdx))
		args = append(args, *f.TagID)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	// Count total
	var total int
	countQ := "SELECT COUNT(*) FROM tasks t WHERE " + whereClause
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, err
	}

	orderBy := "t.position ASC"
	switch f.Sort {
	case "due_date":
		orderBy = "t.due_date ASC NULLS LAST"
	case "priority":
		orderBy = "t.priority ASC"
	case "created_at":
		orderBy = "t.created_at DESC"
	}

	q := fmt.Sprintf(
		`SELECT t.id, t.user_id, t.project_id, t.title, t.description, t.due_date,
		        t.priority, t.status, t.position, t.created_at, t.updated_at
		 FROM tasks t
		 WHERE %s
		 ORDER BY %s
		 LIMIT $%d OFFSET $%d`,
		whereClause, orderBy, argIdx, argIdx+1,
	)
	args = append(args, f.Limit, f.Offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(&t.ID, &t.UserID, &t.ProjectID, &t.Title, &t.Description,
			&t.DueDate, &t.Priority, &t.Status, &t.Position,
			&t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Load subtask counts and tags in bulk
	if len(tasks) > 0 {
		taskIDs := make([]uuid.UUID, len(tasks))
		taskMap := make(map[uuid.UUID]*model.Task, len(tasks))
		for i := range tasks {
			taskIDs[i] = tasks[i].ID
			taskMap[tasks[i].ID] = &tasks[i]
		}

		if err := r.loadSubtaskCounts(ctx, taskMap, taskIDs); err != nil {
			return nil, err
		}
		if err := r.loadTags(ctx, taskMap, taskIDs); err != nil {
			return nil, err
		}
	}

	if tasks == nil {
		tasks = []model.Task{}
	}
	return &model.TaskListResult{Tasks: tasks, Total: total}, nil
}

func (r *TaskRepo) GetByID(ctx context.Context, userID, id uuid.UUID) (*model.Task, error) {
	var t model.Task
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, project_id, title, description, due_date,
		        priority, status, position, created_at, updated_at
		 FROM tasks WHERE id = $1 AND user_id = $2`,
		id, userID,
	).Scan(&t.ID, &t.UserID, &t.ProjectID, &t.Title, &t.Description,
		&t.DueDate, &t.Priority, &t.Status, &t.Position,
		&t.CreatedAt, &t.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	taskMap := map[uuid.UUID]*model.Task{t.ID: &t}
	ids := []uuid.UUID{t.ID}
	if err := r.loadSubtaskCounts(ctx, taskMap, ids); err != nil {
		return nil, err
	}
	if err := r.loadTags(ctx, taskMap, ids); err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepo) Create(ctx context.Context, userID uuid.UUID, in model.TaskInput) (*model.Task, error) {
	priority := "medium"
	if in.Priority != nil {
		priority = *in.Priority
	}
	status := "todo"
	if in.Status != nil {
		status = *in.Status
	}

	// Auto-assign position: max(position) + 1 for this project
	var pos float64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE user_id = $1 AND project_id = $2`,
		userID, in.ProjectID,
	).Scan(&pos)
	if err != nil {
		return nil, err
	}

	var t model.Task
	err = r.pool.QueryRow(ctx,
		`INSERT INTO tasks (user_id, project_id, title, description, due_date, priority, status, position)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, user_id, project_id, title, description, due_date,
		           priority, status, position, created_at, updated_at`,
		userID, in.ProjectID, in.Title, in.Description, in.DueDate, priority, status, pos,
	).Scan(&t.ID, &t.UserID, &t.ProjectID, &t.Title, &t.Description,
		&t.DueDate, &t.Priority, &t.Status, &t.Position,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	t.Tags = []model.Tag{}
	return &t, nil
}

func (r *TaskRepo) Update(ctx context.Context, userID, id uuid.UUID, in model.TaskUpdate) (*model.Task, error) {
	var sets []string
	var args []interface{}
	argIdx := 1

	addSet := func(col string, val interface{}) {
		sets = append(sets, fmt.Sprintf("%s = $%d", col, argIdx))
		args = append(args, val)
		argIdx++
	}

	if in.ProjectID != nil {
		addSet("project_id", *in.ProjectID)
	}
	if in.Title != nil {
		addSet("title", *in.Title)
	}
	if in.Description != nil {
		addSet("description", *in.Description)
	}
	if in.DueDate != nil {
		addSet("due_date", *in.DueDate)
	}
	if in.Priority != nil {
		addSet("priority", *in.Priority)
	}
	if in.Status != nil {
		addSet("status", *in.Status)
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, userID, id)
	}

	q := fmt.Sprintf(
		`UPDATE tasks SET %s WHERE id = $%d AND user_id = $%d
		 RETURNING id, user_id, project_id, title, description, due_date,
		           priority, status, position, created_at, updated_at`,
		strings.Join(sets, ", "), argIdx, argIdx+1,
	)
	args = append(args, id, userID)

	var t model.Task
	err := r.pool.QueryRow(ctx, q, args...).Scan(
		&t.ID, &t.UserID, &t.ProjectID, &t.Title, &t.Description,
		&t.DueDate, &t.Priority, &t.Status, &t.Position,
		&t.CreatedAt, &t.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	taskMap := map[uuid.UUID]*model.Task{t.ID: &t}
	ids := []uuid.UUID{t.ID}
	_ = r.loadSubtaskCounts(ctx, taskMap, ids)
	_ = r.loadTags(ctx, taskMap, ids)
	return &t, nil
}

func (r *TaskRepo) UpdatePosition(ctx context.Context, userID, id uuid.UUID, in model.PositionUpdate) (*model.Task, error) {
	var q string
	var args []interface{}

	if in.Status != nil {
		q = `UPDATE tasks SET position = $1, status = $2 WHERE id = $3 AND user_id = $4
		     RETURNING id, user_id, project_id, title, description, due_date,
		              priority, status, position, created_at, updated_at`
		args = []interface{}{in.Position, *in.Status, id, userID}
	} else {
		q = `UPDATE tasks SET position = $1 WHERE id = $2 AND user_id = $3
		     RETURNING id, user_id, project_id, title, description, due_date,
		              priority, status, position, created_at, updated_at`
		args = []interface{}{in.Position, id, userID}
	}

	var t model.Task
	err := r.pool.QueryRow(ctx, q, args...).Scan(
		&t.ID, &t.UserID, &t.ProjectID, &t.Title, &t.Description,
		&t.DueDate, &t.Priority, &t.Status, &t.Position,
		&t.CreatedAt, &t.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	taskMap := map[uuid.UUID]*model.Task{t.ID: &t}
	ids := []uuid.UUID{t.ID}
	_ = r.loadSubtaskCounts(ctx, taskMap, ids)
	_ = r.loadTags(ctx, taskMap, ids)
	return &t, nil
}

func (r *TaskRepo) Delete(ctx context.Context, userID, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM tasks WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

// ExistsForUser reports whether a task belongs to the given user.
func (r *TaskRepo) ExistsForUser(ctx context.Context, userID, taskID uuid.UUID) (bool, error) {
	var one int
	err := r.pool.QueryRow(ctx,
		`SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2`,
		taskID, userID,
	).Scan(&one)
	if err == pgx.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

// SyncStatusWithSubtasks sets parent task status from subtask completion:
// - If the task has subtasks and all are completed, status becomes done.
// - If any subtask is incomplete and status was done, status becomes in_progress.
// - Tasks with no subtasks are unchanged.
func (r *TaskRepo) SyncStatusWithSubtasks(ctx context.Context, userID, taskID uuid.UUID) error {
	var total, completed int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*)::int, COUNT(*) FILTER (WHERE completed)::int
		 FROM subtasks WHERE task_id = $1 AND user_id = $2`,
		taskID, userID,
	).Scan(&total, &completed)
	if err != nil {
		return err
	}
	if total == 0 {
		return nil
	}
	if completed == total {
		_, err := r.pool.Exec(ctx,
			`UPDATE tasks SET status = 'done' WHERE id = $1 AND user_id = $2`,
			taskID, userID,
		)
		return err
	}
	_, err = r.pool.Exec(ctx,
		`UPDATE tasks SET status = 'in_progress' WHERE id = $1 AND user_id = $2 AND status = 'done'`,
		taskID, userID,
	)
	return err
}

func (r *TaskRepo) loadSubtaskCounts(ctx context.Context, taskMap map[uuid.UUID]*model.Task, ids []uuid.UUID) error {
	rows, err := r.pool.Query(ctx,
		`SELECT task_id,
		        COUNT(*) AS total,
		        COUNT(*) FILTER (WHERE completed) AS done
		 FROM subtasks WHERE task_id = ANY($1) GROUP BY task_id`, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var tid uuid.UUID
		var total, done int
		if err := rows.Scan(&tid, &total, &done); err != nil {
			return err
		}
		if t, ok := taskMap[tid]; ok {
			t.SubtaskTotal = total
			t.SubtaskCompleted = done
		}
	}
	return rows.Err()
}

func (r *TaskRepo) loadTags(ctx context.Context, taskMap map[uuid.UUID]*model.Task, ids []uuid.UUID) error {
	// Ensure all tasks have initialized Tags slice
	for _, t := range taskMap {
		if t.Tags == nil {
			t.Tags = []model.Tag{}
		}
	}

	rows, err := r.pool.Query(ctx,
		`SELECT tt.task_id, tg.id, tg.name, tg.color
		 FROM task_tags tt
		 JOIN tags tg ON tg.id = tt.tag_id
		 WHERE tt.task_id = ANY($1)`, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var tid uuid.UUID
		var tag model.Tag
		if err := rows.Scan(&tid, &tag.ID, &tag.Name, &tag.Color); err != nil {
			return err
		}
		if t, ok := taskMap[tid]; ok {
			t.Tags = append(t.Tags, tag)
		}
	}
	return rows.Err()
}
