package repo

import (
	"context"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubtaskRepo struct {
	pool *pgxpool.Pool
}

func NewSubtaskRepo(pool *pgxpool.Pool) *SubtaskRepo {
	return &SubtaskRepo{pool: pool}
}

func (r *SubtaskRepo) ListByTask(ctx context.Context, userID, taskID uuid.UUID) ([]model.Subtask, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, task_id, title, completed, position, created_at, updated_at
		 FROM subtasks WHERE task_id = $1 AND user_id = $2
		 ORDER BY position ASC`,
		taskID, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subtasks []model.Subtask
	for rows.Next() {
		var s model.Subtask
		if err := rows.Scan(&s.ID, &s.UserID, &s.TaskID, &s.Title,
			&s.Completed, &s.Position, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		subtasks = append(subtasks, s)
	}
	if subtasks == nil {
		subtasks = []model.Subtask{}
	}
	return subtasks, rows.Err()
}

func (r *SubtaskRepo) Create(ctx context.Context, userID, taskID uuid.UUID, in model.SubtaskInput) (*model.Subtask, error) {
	var pos float64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(MAX(position), 0) + 1 FROM subtasks WHERE task_id = $1`,
		taskID,
	).Scan(&pos)
	if err != nil {
		return nil, err
	}

	var s model.Subtask
	err = r.pool.QueryRow(ctx,
		`INSERT INTO subtasks (user_id, task_id, title, position)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, task_id, title, completed, position, created_at, updated_at`,
		userID, taskID, in.Title, pos,
	).Scan(&s.ID, &s.UserID, &s.TaskID, &s.Title, &s.Completed,
		&s.Position, &s.CreatedAt, &s.UpdatedAt)
	return &s, err
}

func (r *SubtaskRepo) Update(ctx context.Context, userID, id uuid.UUID, in model.SubtaskInput) (*model.Subtask, error) {
	var s model.Subtask
	err := r.pool.QueryRow(ctx,
		`UPDATE subtasks SET title = $1
		 WHERE id = $2 AND user_id = $3
		 RETURNING id, user_id, task_id, title, completed, position, created_at, updated_at`,
		in.Title, id, userID,
	).Scan(&s.ID, &s.UserID, &s.TaskID, &s.Title, &s.Completed,
		&s.Position, &s.CreatedAt, &s.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return &s, err
}

func (r *SubtaskRepo) Toggle(ctx context.Context, userID, id uuid.UUID) (*model.Subtask, error) {
	var s model.Subtask
	err := r.pool.QueryRow(ctx,
		`UPDATE subtasks SET completed = NOT completed
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, task_id, title, completed, position, created_at, updated_at`,
		id, userID,
	).Scan(&s.ID, &s.UserID, &s.TaskID, &s.Title, &s.Completed,
		&s.Position, &s.CreatedAt, &s.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return &s, err
}

// Delete removes a subtask and returns its task_id, or uuid.Nil if no row was deleted.
func (r *SubtaskRepo) Delete(ctx context.Context, userID, id uuid.UUID) (taskID uuid.UUID, err error) {
	err = r.pool.QueryRow(ctx,
		`DELETE FROM subtasks WHERE id = $1 AND user_id = $2 RETURNING task_id`,
		id, userID,
	).Scan(&taskID)
	if err == pgx.ErrNoRows {
		return uuid.Nil, nil
	}
	return taskID, err
}
