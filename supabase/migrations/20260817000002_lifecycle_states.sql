-- Order idempotency: prevents duplicate orders from double-taps, retries,
-- and page refreshes. The client generates a UUID per submission attempt.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Payment idempotency: for future Stripe webhook duplicate delivery.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id text;
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_id_idx
  ON payments (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- Bill provider fields (future Stripe integration).
ALTER TABLE bills ADD COLUMN IF NOT EXISTS provider text DEFAULT 'manual';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS provider_payment_id text;

-- Close duplicate active sessions (keep the most recent per table) so the
-- unique partial index can be created cleanly.
WITH duplicates AS (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY table_id ORDER BY opened_at DESC) AS rn
    FROM table_sessions
    WHERE status IN ('open', 'bill_requested')
  ) t WHERE rn > 1
)
UPDATE table_sessions SET status = 'closed', closed_at = now()
WHERE id IN (SELECT id FROM duplicates);

-- One active session per table — the database-level concurrency guard.
-- Two simultaneous QR scans cannot create two active sessions for the same
-- table; the second insert fails with a unique violation and the code
-- retries by finding the existing session.
CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_one_active_per_table
  ON table_sessions (table_id)
  WHERE status IN ('open', 'bill_requested', 'payment_pending', 'paid');

-- State transition validation: the database rejects invalid lifecycle
-- transitions even if the application code has a bug.
CREATE OR REPLACE FUNCTION validate_session_transition()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT (
      (OLD.status = 'open'         AND NEW.status IN ('bill_requested','payment_pending','paid','closed'))
      OR (OLD.status = 'bill_requested'  AND NEW.status IN ('open','payment_pending','paid','closed'))
      OR (OLD.status = 'payment_pending' AND NEW.status IN ('paid','bill_requested','closed'))
      OR (OLD.status = 'paid'       AND NEW.status IN ('closed'))
    ) THEN
      RAISE EXCEPTION 'Invalid session transition: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS table_sessions_transition_check ON table_sessions;
CREATE TRIGGER table_sessions_transition_check
  BEFORE UPDATE ON table_sessions
  FOR EACH ROW EXECUTE FUNCTION validate_session_transition();