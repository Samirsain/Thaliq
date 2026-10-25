-- 3.3: Staff security, session invalidation, and action history.
--
-- Adds brute-force protection (failed_attempts, locked_until), server-side
-- session revocation (session_version), and a general action log for
-- payments and table closures. Order status changes continue to use
-- order_status_history.

ALTER TABLE staff ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

-- General staff action log for payments, closures, and other operational
-- actions. Order status changes use order_status_history separately.
CREATE TABLE IF NOT EXISTS staff_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
  table_session_id uuid REFERENCES table_sessions (id) ON DELETE SET NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_action_log_staff_id_idx ON staff_action_log (staff_id);
CREATE INDEX IF NOT EXISTS staff_action_log_restaurant_id_idx ON staff_action_log (restaurant_id);
CREATE INDEX IF NOT EXISTS staff_action_log_created_at_idx ON staff_action_log (created_at);
