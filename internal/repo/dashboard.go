package repo

import (
	"context"

	"todoflow/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardRepo struct {
	pool *pgxpool.Pool
}

func NewDashboardRepo(pool *pgxpool.Pool) *DashboardRepo {
	return &DashboardRepo{pool: pool}
}

func (r *DashboardRepo) Get(ctx context.Context, userID uuid.UUID) (*model.Dashboard, error) {
	d := &model.Dashboard{}

	// Total tasks
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM tasks WHERE user_id = $1`, userID,
	).Scan(&d.TotalTasks)
	if err != nil {
		return nil, err
	}

	// Completed today
	err = r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM tasks
		 WHERE user_id = $1 AND status = 'done'
		   AND updated_at::date = CURRENT_DATE`, userID,
	).Scan(&d.CompletedToday)
	if err != nil {
		return nil, err
	}

	// Overdue count
	err = r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM tasks
		 WHERE user_id = $1 AND status != 'done'
		   AND due_date < CURRENT_DATE`, userID,
	).Scan(&d.OverdueCount)
	if err != nil {
		return nil, err
	}

	// Project progress
	rows, err := r.pool.Query(ctx,
		`SELECT p.id, p.name,
		        COUNT(t.id) AS total,
		        COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed
		 FROM projects p
		 LEFT JOIN tasks t ON t.project_id = p.id
		 WHERE p.user_id = $1
		 GROUP BY p.id, p.name
		 ORDER BY p.name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var pp model.ProjectProgress
		if err := rows.Scan(&pp.ProjectID, &pp.ProjectName, &pp.Total, &pp.Completed); err != nil {
			return nil, err
		}
		d.ProjectProgress = append(d.ProjectProgress, pp)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if d.ProjectProgress == nil {
		d.ProjectProgress = []model.ProjectProgress{}
	}

	// Recent activity (last 20 tasks created/updated)
	actRows, err := r.pool.Query(ctx,
		`SELECT id, title,
		        CASE
		          WHEN status = 'done' THEN 'completed'
		          WHEN created_at = updated_at THEN 'created'
		          ELSE 'updated'
		        END AS action,
		        updated_at
		 FROM tasks WHERE user_id = $1
		 ORDER BY updated_at DESC LIMIT 20`, userID)
	if err != nil {
		return nil, err
	}
	defer actRows.Close()
	for actRows.Next() {
		var a model.Activity
		if err := actRows.Scan(&a.ID, &a.TaskTitle, &a.Action, &a.Timestamp); err != nil {
			return nil, err
		}
		d.RecentActivity = append(d.RecentActivity, a)
	}
	if err := actRows.Err(); err != nil {
		return nil, err
	}
	if d.RecentActivity == nil {
		d.RecentActivity = []model.Activity{}
	}

	// Upcoming deadlines (next 7 days)
	dlRows, err := r.pool.Query(ctx,
		`SELECT id, user_id, project_id, title, description, due_date,
		        priority, status, position, created_at, updated_at
		 FROM tasks
		 WHERE user_id = $1 AND status != 'done'
		   AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
		 ORDER BY due_date ASC LIMIT 20`, userID)
	if err != nil {
		return nil, err
	}
	defer dlRows.Close()
	for dlRows.Next() {
		var t model.Task
		if err := dlRows.Scan(&t.ID, &t.UserID, &t.ProjectID, &t.Title, &t.Description,
			&t.DueDate, &t.Priority, &t.Status, &t.Position,
			&t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		t.Tags = []model.Tag{}
		d.UpcomingDeadlines = append(d.UpcomingDeadlines, t)
	}
	if err := dlRows.Err(); err != nil {
		return nil, err
	}
	if d.UpcomingDeadlines == nil {
		d.UpcomingDeadlines = []model.Task{}
	}

	return d, nil
}
