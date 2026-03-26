package repo

import (
	"context"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SearchRepo struct {
	pool  *pgxpool.Pool
	tasks *TaskRepo
}

func NewSearchRepo(pool *pgxpool.Pool, tasks *TaskRepo) *SearchRepo {
	return &SearchRepo{pool: pool, tasks: tasks}
}

func (r *SearchRepo) Search(ctx context.Context, userID uuid.UUID, query string, limit int) ([]model.Task, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, project_id, title, description, due_date,
		        priority, status, position, created_at, updated_at
		 FROM tasks
		 WHERE user_id = $1
		   AND search_vector @@ plainto_tsquery('english', $2)
		 ORDER BY ts_rank(search_vector, plainto_tsquery('english', $2)) DESC
		 LIMIT $3`,
		userID, query, limit,
	)
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
	if tasks == nil {
		tasks = []model.Task{}
	}
	if err := r.tasks.EnrichTasks(ctx, tasks); err != nil {
		return nil, err
	}
	return tasks, nil
}
