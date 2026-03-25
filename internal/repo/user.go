package repo

import (
	"context"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

func (r *UserRepo) Upsert(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.pool.QueryRow(ctx,
		`INSERT INTO users (id) VALUES ($1)
		 ON CONFLICT (id) DO NOTHING
		 RETURNING id, created_at`,
		id,
	).Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		// ON CONFLICT DO NOTHING returns no rows; fetch instead
		err = r.pool.QueryRow(ctx,
			`SELECT id, created_at FROM users WHERE id = $1`, id,
		).Scan(&u.ID, &u.CreatedAt)
		if err != nil {
			return nil, err
		}
	}
	return &u, nil
}
