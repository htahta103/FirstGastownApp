CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated      BEFORE UPDATE ON projects      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated         BEFORE UPDATE ON tasks         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subtasks_updated      BEFORE UPDATE ON subtasks      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tags_updated          BEFORE UPDATE ON tags          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_saved_filters_updated BEFORE UPDATE ON saved_filters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
