package middleware

import (
	"context"
	"net/http"

	"todoflow/internal/apierr"

	"github.com/google/uuid"
)

type ctxKeyUserID struct{}

func UserID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := r.Header.Get("X-User-Id")
		if raw == "" {
			apierr.Write(w, apierr.BadRequest("X-User-Id header is required"))
			return
		}
		uid, err := uuid.Parse(raw)
		if err != nil {
			apierr.Write(w, apierr.BadRequest("X-User-Id must be a valid UUID"))
			return
		}
		ctx := context.WithValue(r.Context(), ctxKeyUserID{}, uid)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserID(ctx context.Context) uuid.UUID {
	if uid, ok := ctx.Value(ctxKeyUserID{}).(uuid.UUID); ok {
		return uid
	}
	return uuid.Nil
}
