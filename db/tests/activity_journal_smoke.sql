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

WITH created AS (
  INSERT INTO hardware_components(owner_id,category,name,part_number,quantity_on_hand,minimum_stock)
  VALUES ('activity-smoke-owner','IC','Smoke test regulator','CI-REG-001',0,1)
  RETURNING id,owner_id,name,part_number,category
),
logged AS (
  INSERT INTO activity_events(owner_id,actor_type,event_type,resource_type,resource_id,summary,details)
  SELECT owner_id,'owner','hardware_component.created','hardware_component',id::text,
         'Added hardware component: ' || name,
         jsonb_build_object('part_number',part_number,'category',category)
  FROM created
)
SELECT id FROM created;

WITH updated AS (
  UPDATE hardware_components SET quantity_on_hand=quantity_on_hand+5
  WHERE owner_id='activity-smoke-owner' AND part_number='CI-REG-001'
  RETURNING id,owner_id,name,part_number,quantity_on_hand
),
movement AS (
  INSERT INTO hardware_stock_movements(owner_id,component_id,movement_type,quantity_delta,reason)
  SELECT owner_id,id,'stock_in',5,'CI stock receipt' FROM updated
  RETURNING id
),
logged AS (
  INSERT INTO activity_events(owner_id,actor_type,event_type,resource_type,resource_id,summary,details)
  SELECT updated.owner_id,'owner','hardware.stock_adjusted','hardware_component',updated.id::text,
         'Adjusted stock: ' || updated.name,
         jsonb_build_object('delta',5,'movement_type','stock_in','movement_id',movement.id)
  FROM updated CROSS JOIN movement
)
SELECT updated.id FROM updated CROSS JOIN movement;

WITH created AS (
  INSERT INTO project_bom_items(owner_id,project_id,component_id,quantity_required,reference_designator,notes)
  SELECT 'activity-smoke-owner',p.id,c.id,2,'U1','CI BOM test'
  FROM personal_projects p CROSS JOIN hardware_components c
  WHERE p.owner_id='activity-smoke-owner' AND p.name='Activity smoke project'
    AND c.owner_id='activity-smoke-owner' AND c.part_number='CI-REG-001'
  RETURNING id,project_id,component_id,quantity_required,reference_designator
),
logged AS (
  INSERT INTO activity_events(owner_id,actor_type,event_type,resource_type,resource_id,summary,details)
  SELECT 'activity-smoke-owner','owner','hardware.bom_item_added','project_bom_item',id::text,
         'Added component to project bill of materials',
         jsonb_build_object('project_id',project_id,'component_id',component_id,'quantity_required',quantity_required,'reference_designator',reference_designator)
  FROM created
)
SELECT id FROM created;

DO $$
DECLARE event_count integer;
BEGIN
  SELECT count(*) INTO event_count FROM activity_events WHERE owner_id = 'activity-smoke-owner';
  IF event_count <> 7 THEN
    RAISE EXCEPTION 'Expected 7 activity events, received %', event_count;
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
