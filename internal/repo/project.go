package repo

import (
	"context"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProjectRepo struct {
	pool *pgxpool.Pool
}

func NewProjectRepo(pool *pgxpool.Pool) *ProjectRepo {
	return &ProjectRepo{pool: pool}
}

func (r *ProjectRepo) List(ctx context.Context, userID uuid.UUID) ([]model.Project, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT p.id, p.user_id, p.name, p.icon, p.color, p.created_at, p.updated_at,
		        COALESCE(tc.cnt, 0) AS task_count
		 FROM projects p
		 LEFT JOIN (SELECT project_id, COUNT(*) AS cnt FROM tasks GROUP BY project_id) tc
		   ON tc.project_id = p.id
		 WHERE p.user_id = $1
		 ORDER BY p.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.Icon, &p.Color,
			&p.CreatedAt, &p.UpdatedAt, &p.TaskCount); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, rows.Err()
}

func (r *ProjectRepo) GetByID(ctx context.Context, userID, id uuid.UUID) (*model.Project, error) {
	var p model.Project
	err := r.pool.QueryRow(ctx,
		`SELECT p.id, p.user_id, p.name, p.icon, p.color, p.created_at, p.updated_at,
		        COALESCE(tc.cnt, 0) AS task_count
		 FROM projects p
		 LEFT JOIN (SELECT project_id, COUNT(*) AS cnt FROM tasks GROUP BY project_id) tc
		   ON tc.project_id = p.id
		 WHERE p.id = $1 AND p.user_id = $2`,
		id, userID,
	).Scan(&p.ID, &p.UserID, &p.Name, &p.Icon, &p.Color,
		&p.CreatedAt, &p.UpdatedAt, &p.TaskCount)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return &p, err
}

func (r *ProjectRepo) Create(ctx context.Context, userID uuid.UUID, in model.ProjectInput) (*model.Project, error) {
	icon := "folder"
	if in.Icon != nil {
		icon = *in.Icon
	}
	color := "#3B82F6"
	if in.Color != nil {
		color = *in.Color
	}

	var p model.Project
	err := r.pool.QueryRow(ctx,
		`INSERT INTO projects (user_id, name, icon, color)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, name, icon, color, created_at, updated_at`,
		userID, in.Name, icon, color,
	).Scan(&p.ID, &p.UserID, &p.Name, &p.Icon, &p.Color, &p.CreatedAt, &p.UpdatedAt)
	return &p, err
}

func (r *ProjectRepo) Update(ctx context.Context, userID, id uuid.UUID, in model.ProjectInput) (*model.Project, error) {
	icon := "folder"
	if in.Icon != nil {
		icon = *in.Icon
	}
	color := "#3B82F6"
	if in.Color != nil {
		color = *in.Color
	}

	var p model.Project
	err := r.pool.QueryRow(ctx,
		`UPDATE projects SET name = $1, icon = $2, color = $3
		 WHERE id = $4 AND user_id = $5
		 RETURNING id, user_id, name, icon, color, created_at, updated_at`,
		in.Name, icon, color, id, userID,
	).Scan(&p.ID, &p.UserID, &p.Name, &p.Icon, &p.Color, &p.CreatedAt, &p.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return &p, err
}

func (r *ProjectRepo) Delete(ctx context.Context, userID, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM projects WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	return err
}
