package apierr

import (
	"encoding/json"
	"net/http"
)

type AppError struct {
	Code       string      `json:"code"`
	Message    string      `json:"message"`
	Details    interface{} `json:"details,omitempty"`
	HTTPStatus int         `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

type errorEnvelope struct {
	Error *AppError `json:"error"`
}

func Write(w http.ResponseWriter, err *AppError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(err.HTTPStatus)
	_ = json.NewEncoder(w).Encode(errorEnvelope{Error: err})
}

func NotFound(entity string) *AppError {
	return &AppError{
		Code:       "NOT_FOUND",
		Message:    entity + " not found",
		HTTPStatus: http.StatusNotFound,
	}
}

func Validation(field, reason string) *AppError {
	return &AppError{
		Code:       "VALIDATION_ERROR",
		Message:    "Validation failed",
		Details:    map[string]string{"field": field, "reason": reason},
		HTTPStatus: http.StatusUnprocessableEntity,
	}
}

func BadRequest(msg string) *AppError {
	return &AppError{
		Code:       "BAD_REQUEST",
		Message:    msg,
		HTTPStatus: http.StatusBadRequest,
	}
}

func Internal(msg string) *AppError {
	return &AppError{
		Code:       "INTERNAL_ERROR",
		Message:    msg,
		HTTPStatus: http.StatusInternalServerError,
	}
}
