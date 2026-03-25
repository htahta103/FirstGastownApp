DROP TRIGGER IF EXISTS trg_saved_filters_updated ON saved_filters;
DROP TRIGGER IF EXISTS trg_tags_updated ON tags;
DROP TRIGGER IF EXISTS trg_subtasks_updated ON subtasks;
DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
DROP FUNCTION IF EXISTS update_updated_at();
