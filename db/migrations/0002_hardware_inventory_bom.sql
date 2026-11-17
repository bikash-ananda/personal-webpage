-- Electronics and hardware inventory plus project bill of materials.
-- Apply after 0001_personal_os_core.sql on the dedicated Personal OS database.
BEGIN;

CREATE TABLE IF NOT EXISTS hardware_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Other' CHECK (length(trim(category)) BETWEEN 1 AND 80),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 180),
  manufacturer text NOT NULL DEFAULT '',
  part_number text NOT NULL CHECK (length(trim(part_number)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  package text NOT NULL DEFAULT '',
  datasheet_url text,
  quantity_on_hand numeric(14,3) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  minimum_stock numeric(14,3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  unit text NOT NULL DEFAULT 'pcs' CHECK (unit IN ('pcs','m','cm','g','kg','ml','l','set','roll')),
  storage_location text NOT NULL DEFAULT '',
  unit_cost numeric(14,2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
  currency char(3) NOT NULL DEFAULT 'NPR',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, part_number),
  UNIQUE(id, owner_id)
);
CREATE INDEX IF NOT EXISTS hardware_components_owner_name_idx ON hardware_components(owner_id, name);
CREATE INDEX IF NOT EXISTS hardware_components_owner_category_idx ON hardware_components(owner_id, category);

CREATE TABLE IF NOT EXISTS project_bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  component_id uuid NOT NULL,
  quantity_required numeric(14,3) NOT NULL CHECK (quantity_required > 0),
  reference_designator text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(project_id, owner_id) REFERENCES personal_projects(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY(component_id, owner_id) REFERENCES hardware_components(id, owner_id) ON DELETE CASCADE,
  UNIQUE(project_id, component_id, reference_designator)
);
CREATE INDEX IF NOT EXISTS project_bom_owner_project_idx ON project_bom_items(owner_id, project_id);

COMMIT;
