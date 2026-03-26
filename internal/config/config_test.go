package config

import "testing"

func TestLoadRequiresRuntimeEnvVars(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("PORT", "")
	t.Setenv("CORS_ORIGIN", "")

	_, err := Load()
	if err == nil || err.Error() != "DATABASE_URL is required" {
		t.Fatalf("expected DATABASE_URL error, got %v", err)
	}

	t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
	_, err = Load()
	if err == nil || err.Error() != "PORT is required" {
		t.Fatalf("expected PORT error, got %v", err)
	}

	t.Setenv("PORT", "8080")
	_, err = Load()
	if err == nil || err.Error() != "CORS_ORIGIN is required" {
		t.Fatalf("expected CORS_ORIGIN error, got %v", err)
	}
}

func TestLoadUsesProvidedRuntimeEnvVars(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://user:pass@db.internal:5432/todoflow?sslmode=disable")
	t.Setenv("PORT", "9090")
	t.Setenv("CORS_ORIGIN", "https://todoflow-staging.pages.dev")
	t.Setenv("STATIC_DIR", "/app/static")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected config to load, got error: %v", err)
	}

	if cfg.DatabaseURL != "postgres://user:pass@db.internal:5432/todoflow?sslmode=disable" {
		t.Fatalf("unexpected DATABASE_URL: %s", cfg.DatabaseURL)
	}
	if cfg.Port != "9090" {
		t.Fatalf("unexpected PORT: %s", cfg.Port)
	}
	if cfg.CORSOrigin != "https://todoflow-staging.pages.dev" {
		t.Fatalf("unexpected CORS_ORIGIN: %s", cfg.CORSOrigin)
	}
	if cfg.StaticDir != "/app/static" {
		t.Fatalf("unexpected STATIC_DIR: %s", cfg.StaticDir)
	}
}
