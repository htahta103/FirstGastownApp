package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL string
	Port        string
	CORSOrigin  string
	// StaticDir, if set, serves the SPA (e.g. Vite build output) and falls back to index.html.
	StaticDir string
}

func Load() (*Config, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		return nil, fmt.Errorf("PORT is required")
	}

	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		return nil, fmt.Errorf("CORS_ORIGIN is required")
	}

	staticDir := os.Getenv("STATIC_DIR")

	return &Config{
		DatabaseURL: dbURL,
		Port:        port,
		CORSOrigin:  corsOrigin,
		StaticDir:   staticDir,
	}, nil
}
