-- Personal OS domain schema. Apply only after Better Auth has created its "user" table.
-- Run against a dedicated development database first. Never point this migration at another project DB.
BEGIN;

CREATE TABLE IF NOT EXISTS personal_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 180),
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','paused','completed','archived')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  color text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE(id, owner_id)
);
CREATE INDEX IF NOT EXISTS personal_projects_owner_status_idx ON personal_projects(owner_id,status,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS personal_projects_owner_name_uq ON personal_projects(owner_id,lower(name));

CREATE TABLE IF NOT EXISTS personal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  project_id uuid REFERENCES personal_projects(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 300),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','done','cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  due_at timestamptz,
  completed_at timestamptz,
  source text NOT NULL DEFAULT 'manual',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'done' OR completed_at IS NOT NULL),
  FOREIGN KEY (project_id, owner_id) REFERENCES personal_projects(id, owner_id) ON DELETE SET NULL (project_id)
);
CREATE INDEX IF NOT EXISTS personal_tasks_owner_status_due_idx ON personal_tasks(owner_id,status,due_at);
CREATE INDEX IF NOT EXISTS personal_tasks_project_idx ON personal_tasks(project_id);

CREATE TABLE IF NOT EXISTS personal_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  project_id uuid REFERENCES personal_projects(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 300),
  body text NOT NULL DEFAULT '',
  content_type text NOT NULL DEFAULT 'note' CHECK (content_type IN ('note','document','url','conversation','research','file')),
  source_uri text,
  sensitivity text NOT NULL DEFAULT 'private' CHECK (sensitivity IN ('normal','private','sensitive','restricted')),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  FOREIGN KEY (project_id, owner_id) REFERENCES personal_projects(id, owner_id) ON DELETE SET NULL (project_id)
);
CREATE INDEX IF NOT EXISTS personal_knowledge_owner_updated_idx ON personal_knowledge(owner_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS personal_knowledge_tags_idx ON personal_knowledge USING gin(tags);

CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  agent_key text NOT NULL,
  task text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','waiting_approval','succeeded','failed','cancelled')),
  autonomy_tier smallint NOT NULL DEFAULT 0 CHECK (autonomy_tier BETWEEN 0 AND 3),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error_code text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_runs_owner_created_idx ON agent_runs(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_status_idx ON agent_runs(status,created_at);

CREATE TABLE IF NOT EXISTS action_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  agent_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  action_summary text NOT NULL,
  exact_payload jsonb NOT NULL,
  risk_tier smallint NOT NULL CHECK (risk_tier BETWEEN 0 AND 3),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired','executed','failed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  decided_at timestamptz,
  decision_note text,
  executed_at timestamptz
);
CREATE INDEX IF NOT EXISTS action_approvals_owner_status_idx ON action_approvals(owner_id,status,requested_at DESC);

CREATE TABLE IF NOT EXISTS integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider text NOT NULL,
  account_label text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','expired','error')),
  secret_reference text,
  granted_scopes text[] NOT NULL DEFAULT '{}',
  connected_at timestamptz,
  last_checked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id,provider,account_label)
);
CREATE INDEX IF NOT EXISTS integration_connections_owner_idx ON integration_connections(owner_id,provider);

CREATE TABLE IF NOT EXISTS activity_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('owner','agent','system','integration')),
  actor_id text,
  event_type text NOT NULL,
  resource_type text,
  resource_id text,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_events_owner_created_idx ON activity_events(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS activity_events_resource_idx ON activity_events(resource_type,resource_id);

-- Append-only event journal: updates and deletes are rejected at the database layer.
CREATE OR REPLACE FUNCTION reject_activity_event_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'activity_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS activity_events_no_update ON activity_events;
CREATE TRIGGER activity_events_no_update BEFORE UPDATE ON activity_events
FOR EACH ROW EXECUTE FUNCTION reject_activity_event_mutation();
DROP TRIGGER IF EXISTS activity_events_no_delete ON activity_events;
CREATE TRIGGER activity_events_no_delete BEFORE DELETE ON activity_events
FOR EACH ROW EXECUTE FUNCTION reject_activity_event_mutation();

COMMIT;
