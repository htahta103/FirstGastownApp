package repo

import (
	"context"
	"fmt"
	"strings"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SearchRepo struct {
	pool *pgxpool.Pool
}

func NewSearchRepo(pool *pgxpool.Pool) *SearchRepo {
	return &SearchRepo{pool: pool}
}

func (r *SearchRepo) Search(ctx context.Context, userID uuid.UUID, query string, f model.TaskFilter) ([]model.Task, error) {
	var (
		where  []string
		args   []interface{}
		argIdx = 3
	)

	// Keep user_id = $1 and query = $2 stable so ORDER BY can reference $2.
	where = append(where, "t.user_id = $1")
	where = append(where, "t.search_vector @@ plainto_tsquery('english', $2)")
	args = append(args, userID, query)

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

	q := fmt.Sprintf(
		`SELECT t.id, t.user_id, t.project_id, t.title, t.description, t.due_date,
		        t.priority, t.status, t.position, t.created_at, t.updated_at
		 FROM tasks t
		 WHERE %s
		 ORDER BY ts_rank(t.search_vector, plainto_tsquery('english', $2)) DESC
		 LIMIT $%d`,
		whereClause, argIdx,
	)
	args = append(args, f.Limit)

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
		t.Tags = []model.Tag{}
		tasks = append(tasks, t)
	}
	if tasks == nil {
		tasks = []model.Task{}
	}
	return tasks, rows.Err()
}
