package repo

import (
	"context"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TagRepo struct {
	pool *pgxpool.Pool
}

func NewTagRepo(pool *pgxpool.Pool) *TagRepo {
	return &TagRepo{pool: pool}
}

func (r *TagRepo) List(ctx context.Context, userID uuid.UUID) ([]model.Tag, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, name, color, created_at, updated_at
		 FROM tags WHERE user_id = $1 ORDER BY name ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []model.Tag
	for rows.Next() {
		var t model.Tag
		if err := rows.Scan(&t.ID, &t.UserID, &t.Name, &t.Color, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	if tags == nil {
		tags = []model.Tag{}
	}
	return tags, rows.Err()
}

func (r *TagRepo) Create(ctx context.Context, userID uuid.UUID, in model.TagInput) (*model.Tag, error) {
	color := "#6B7280"
	if in.Color != nil {
		color = *in.Color
	}

	var t model.Tag
	err := r.pool.QueryRow(ctx,
		`INSERT INTO tags (user_id, name, color)
		 VALUES ($1, $2, $3)
		 RETURNING id, user_id, name, color, created_at, updated_at`,
		userID, in.Name, color,
	).Scan(&t.ID, &t.UserID, &t.Name, &t.Color, &t.CreatedAt, &t.UpdatedAt)
	return &t, err
}

func (r *TagRepo) Update(ctx context.Context, userID, id uuid.UUID, in model.TagInput) (*model.Tag, error) {
	color := "#6B7280"
	if in.Color != nil {
		color = *in.Color
	}

	var t model.Tag
	err := r.pool.QueryRow(ctx,
		`UPDATE tags SET name = $1, color = $2
		 WHERE id = $3 AND user_id = $4
		 RETURNING id, user_id, name, color, created_at, updated_at`,
		in.Name, color, id, userID,
	).Scan(&t.ID, &t.UserID, &t.Name, &t.Color, &t.CreatedAt, &t.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return &t, err
}

func (r *TagRepo) Delete(ctx context.Context, userID, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM tags WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

func (r *TagRepo) AttachToTask(ctx context.Context, userID, taskID, tagID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO task_tags (task_id, tag_id)
		 SELECT $1, $2
		 WHERE EXISTS (SELECT 1 FROM tasks WHERE id = $1 AND user_id = $3)
		   AND EXISTS (SELECT 1 FROM tags WHERE id = $2 AND user_id = $3)
		 ON CONFLICT DO NOTHING`,
		taskID, tagID, userID)
	return err
}

func (r *TagRepo) DetachFromTask(ctx context.Context, userID, taskID, tagID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM task_tags
		 WHERE task_id = $1 AND tag_id = $2
		   AND EXISTS (SELECT 1 FROM tasks WHERE id = $1 AND user_id = $3)`,
		taskID, tagID, userID)
	return err
}
