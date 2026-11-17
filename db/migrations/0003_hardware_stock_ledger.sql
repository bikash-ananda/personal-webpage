-- Immutable stock movement journal for hardware inventory.
-- Apply after 0002_hardware_inventory_bom.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS hardware_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  component_id uuid NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('stock_in','stock_out','correction')),
  quantity_delta numeric(14,3) NOT NULL CHECK (quantity_delta <> 0),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 300),
  reference text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(component_id, owner_id) REFERENCES hardware_components(id, owner_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS hardware_stock_movements_owner_created_idx ON hardware_stock_movements(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS hardware_stock_movements_component_idx ON hardware_stock_movements(component_id,created_at DESC);

CREATE OR REPLACE FUNCTION reject_hardware_stock_movement_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'hardware_stock_movements is append-only';
END;
$$;
DROP TRIGGER IF EXISTS hardware_stock_movements_no_update ON hardware_stock_movements;
CREATE TRIGGER hardware_stock_movements_no_update BEFORE UPDATE ON hardware_stock_movements
FOR EACH ROW EXECUTE FUNCTION reject_hardware_stock_movement_mutation();
DROP TRIGGER IF EXISTS hardware_stock_movements_no_delete ON hardware_stock_movements;
CREATE TRIGGER hardware_stock_movements_no_delete BEFORE DELETE ON hardware_stock_movements
FOR EACH ROW EXECUTE FUNCTION reject_hardware_stock_movement_mutation();

COMMIT;
