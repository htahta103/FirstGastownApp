package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"todoflow/internal/config"
	"todoflow/internal/handler"
	"todoflow/internal/middleware"
	"todoflow/internal/repo"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	cfg, err := config.Load()
	if err != nil {
		slog.Error("config", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connect", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		slog.Error("database ping", "error", err)
		os.Exit(1)
	}
	slog.Info("database connected")

	runMigrations(cfg.DatabaseURL)

	r := newRouter(cfg, pool)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down")

	shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown", "error", err)
	}
}

func runMigrations(dbURL string) {
	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		slog.Error("migration init", "error", err)
		os.Exit(1)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		slog.Error("migration run", "error", err)
		os.Exit(1)
	}
	slog.Info("migrations applied")
}

func newRouter(cfg *config.Config, pool *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recovery)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(chimw.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "X-User-Id"},
		ExposedHeaders:   []string{"X-Request-Id"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	userRepo := repo.NewUserRepo(pool)
	projectRepo := repo.NewProjectRepo(pool)
	taskRepo := repo.NewTaskRepo(pool)
	subtaskRepo := repo.NewSubtaskRepo(pool)
	tagRepo := repo.NewTagRepo(pool)
	dashboardRepo := repo.NewDashboardRepo(pool)
	searchRepo := repo.NewSearchRepo(pool)
	filterRepo := repo.NewFilterRepo(pool)

	users := handler.NewUserHandler(userRepo)
	projects := handler.NewProjectHandler(projectRepo)
	tasks := handler.NewTaskHandler(taskRepo)
	subtasks := handler.NewSubtaskHandler(subtaskRepo, taskRepo)
	tags := handler.NewTagHandler(tagRepo)
	dashboard := handler.NewDashboardHandler(dashboardRepo)
	search := handler.NewSearchHandler(searchRepo)
	filters := handler.NewFilterHandler(filterRepo)

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api", func(api chi.Router) {
		api.Use(middleware.UserID)

		api.Post("/users", users.Create)

		api.Route("/projects", func(r chi.Router) {
			r.Get("/", projects.List)
			r.Post("/", projects.Create)
			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", projects.Get)
				r.Put("/", projects.Update)
				r.Delete("/", projects.Delete)
			})
		})

		api.Route("/tasks", func(r chi.Router) {
			r.Get("/", tasks.List)
			r.Get("/calendar", tasks.Calendar)
			r.Post("/", tasks.Create)
			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", tasks.Get)
				r.Put("/", tasks.Update)
				r.Delete("/", tasks.Delete)
				r.Patch("/position", tasks.UpdatePosition)
			})
			r.Route("/{taskId}/subtasks", func(r chi.Router) {
				r.Get("/", subtasks.List)
				r.Post("/", subtasks.Create)
			})
			r.Route("/{taskId}/tags/{tagId}", func(r chi.Router) {
				r.Post("/", tags.AttachToTask)
				r.Delete("/", tags.DetachFromTask)
			})
		})

		api.Route("/subtasks/{id}", func(r chi.Router) {
			r.Put("/", subtasks.Update)
			r.Delete("/", subtasks.Delete)
			r.Patch("/toggle", subtasks.Toggle)
		})

		api.Route("/tags", func(r chi.Router) {
			r.Get("/", tags.List)
			r.Post("/", tags.Create)
			r.Route("/{id}", func(r chi.Router) {
				r.Put("/", tags.Update)
				r.Delete("/", tags.Delete)
			})
		})

		api.Get("/dashboard", dashboard.Get)
		api.Get("/search", search.Search)

		api.Route("/filters", func(r chi.Router) {
			r.Get("/", filters.List)
			r.Post("/", filters.Create)
			r.Route("/{id}", func(r chi.Router) {
				r.Put("/", filters.Update)
				r.Delete("/", filters.Delete)
			})
		})
	})

	return r
}
