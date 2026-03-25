CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE task_status   AS ENUM ('todo', 'in_progress', 'done');

CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    due_date    DATE,
    priority    task_priority NOT NULL DEFAULT 'medium',
    status      task_status   NOT NULL DEFAULT 'todo',
    position    DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user     ON tasks(user_id);
CREATE INDEX idx_tasks_project  ON tasks(project_id);
CREATE INDEX idx_tasks_status   ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_priority ON tasks(user_id, priority);

ALTER TABLE tasks ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX idx_tasks_search ON tasks USING GIN(search_vector);
