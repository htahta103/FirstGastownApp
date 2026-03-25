CREATE TABLE subtasks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title      VARCHAR(500) NOT NULL,
    completed  BOOLEAN NOT NULL DEFAULT false,
    position   DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subtasks_task ON subtasks(task_id);
