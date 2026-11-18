-- Smoke-test the append-only activity journal and the same CTE write pattern used by the API.
BEGIN;

INSERT INTO "user" (id) VALUES ('activity-smoke-owner');

WITH created AS (
  INSERT INTO personal_projects (owner_id, name, summary, priority)
  VALUES ('activity-smoke-owner', 'Activity smoke project', 'CI-only record', 'medium')
  RETURNING id, name, priority
),
logged AS (
  INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
  SELECT 'activity-smoke-owner', 'owner', 'project.created', 'project', id::text,
         'Created project: ' || name, jsonb_build_object('priority', priority)
  FROM created
)
SELECT id FROM created;

WITH created AS (
  INSERT INTO personal_tasks (owner_id, title, priority)
  VALUES ('activity-smoke-owner', 'Activity smoke task', 'high')
  RETURNING id, title, priority, project_id
),
logged AS (
  INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
  SELECT 'activity-smoke-owner', 'owner', 'task.created', 'task', id::text,
         'Created task: ' || title,
         jsonb_build_object('priority', priority, 'project_id', project_id)
  FROM created
)
SELECT id FROM created;

WITH updated AS (
  UPDATE personal_projects SET status = 'paused'
  WHERE owner_id = 'activity-smoke-owner' AND name = 'Activity smoke project'
  RETURNING id, name, status
),
logged AS (
  INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
  SELECT 'activity-smoke-owner', 'owner', 'project.status_changed', 'project', id::text,
         'Changed project status: ' || name, jsonb_build_object('status', status)
  FROM updated
)
SELECT id FROM updated;

WITH updated AS (
  UPDATE personal_tasks SET status = 'done', completed_at = now()
  WHERE owner_id = 'activity-smoke-owner' AND title = 'Activity smoke task'
  RETURNING id, title, status
),
logged AS (
  INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
  SELECT 'activity-smoke-owner', 'owner', 'task.status_changed', 'task', id::text,
         'Changed task status: ' || title, jsonb_build_object('status', status)
  FROM updated
)
SELECT id FROM updated;

DO $$
DECLARE event_count integer;
BEGIN
  SELECT count(*) INTO event_count FROM activity_events WHERE owner_id = 'activity-smoke-owner';
  IF event_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 activity events, received %', event_count;
  END IF;

  BEGIN
    UPDATE activity_events SET summary = 'tampered' WHERE owner_id = 'activity-smoke-owner';
    RAISE EXCEPTION 'Activity event update unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%activity_events is append-only%' THEN RAISE; END IF;
  END;

  BEGIN
    DELETE FROM activity_events WHERE owner_id = 'activity-smoke-owner';
    RAISE EXCEPTION 'Activity event deletion unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%activity_events is append-only%' THEN RAISE; END IF;
  END;
END;
$$;

ROLLBACK;
