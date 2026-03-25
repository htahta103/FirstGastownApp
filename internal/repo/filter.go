package repo

import (
	"context"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FilterRepo struct {
	pool *pgxpool.Pool
}

func NewFilterRepo(pool *pgxpool.Pool) *FilterRepo {
	return &FilterRepo{pool: pool}
}

func (r *FilterRepo) List(ctx context.Context, userID uuid.UUID) ([]model.SavedFilter, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, name, filter_json, created_at
		 FROM saved_filters WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var filters []model.SavedFilter
	for rows.Next() {
		var f model.SavedFilter
		if err := rows.Scan(&f.ID, &f.UserID, &f.Name, &f.FilterJSON, &f.CreatedAt); err != nil {
			return nil, err
		}
		filters = append(filters, f)
	}
	if filters == nil {
		filters = []model.SavedFilter{}
	}
	return filters, rows.Err()
}

func (r *FilterRepo) Create(ctx context.Context, userID uuid.UUID, in model.SavedFilterInput) (*model.SavedFilter, error) {
	var f model.SavedFilter
	err := r.pool.QueryRow(ctx,
		`INSERT INTO saved_filters (user_id, name, filter_json)
		 VALUES ($1, $2, $3)
		 RETURNING id, user_id, name, filter_json, created_at`,
		userID, in.Name, in.FilterJSON,
	).Scan(&f.ID, &f.UserID, &f.Name, &f.FilterJSON, &f.CreatedAt)
	return &f, err
}

func (r *FilterRepo) Update(ctx context.Context, userID, id uuid.UUID, in model.SavedFilterInput) (*model.SavedFilter, error) {
	var f model.SavedFilter
	err := r.pool.QueryRow(ctx,
		`UPDATE saved_filters SET name = $1, filter_json = $2
		 WHERE id = $3 AND user_id = $4
		 RETURNING id, user_id, name, filter_json, created_at`,
		in.Name, in.FilterJSON, id, userID,
	).Scan(&f.ID, &f.UserID, &f.Name, &f.FilterJSON, &f.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return &f, err
}

func (r *FilterRepo) Delete(ctx context.Context, userID, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM saved_filters WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}
